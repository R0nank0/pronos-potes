<?php
	error_reporting(E_ERROR | E_WARNING | E_PARSE);
	set_time_limit(0);
	require_once('../configuration.php');

	global $db;
	$config = new JConfig();
	$db = mysqli_connect($config->host, $config->user, $config->password, $config->db);

	if (!$db) {
		echo "Error: Unable to connect to MySQL." . PHP_EOL . "<BR />";
		echo "Debugging errno: " . mysqli_connect_errno() . PHP_EOL;
		echo "Debugging error: " . mysqli_connect_error() . PHP_EOL;
		exit;
	}

	// Debug: afficher la base de données utilisée
	echo "🔍 Base de données: {$config->db}\n";
	echo "🔍 Host: {$config->host}\n";
	echo "🔍 User: {$config->user}\n";

	// Détecter le bon préfixe de table
	$tableSeasonFound = null;
	$tableGameFound = null;
	$tablePredictionFound = null;

	$possiblePrefixes = ['xfxg_', 'ngwg_xfxg_', ''];
	foreach ($possiblePrefixes as $prefix) {
		$testTable = $prefix . 'multileague_season';
		$result = @mysqli_query($db, "SELECT 1 FROM $testTable LIMIT 1");
		if ($result) {
			$tableSeasonFound = $testTable;
			$tableGameFound = $prefix . 'multileague_game';
			$tablePredictionFound = $prefix . 'multileague_player_prediction';
			echo "✅ Tables trouvées avec le préfixe: '$prefix'\n";
			break;
		}
	}

	if (!$tableSeasonFound) {
		echo "❌ Impossible de trouver les tables multileague_season\n";
		echo "💡 Vérifiez que vous êtes connecté à la bonne base de données\n";
		exit(1);
	}

	echo "\n";

	// ================================================================
	// CONFIGURATION
	// ================================================================

	// Répertoire de sortie pour les fichiers JSON
	$outputDir = __DIR__ . '/datasources';
	if (!is_dir($outputDir)) {
		mkdir($outputDir, 0755, true);
	}

	// Mapping des compétitions avec leurs IDs (depuis season-ids-by-competition.txt)
	$competitionSeasons = [
		'ligue1' => [1,2,4,8,12,16,18,23,27,31,35,40,43,46,50,54,57,61,67],
		'ldc' => [6,9,14,21,25,28,32,37,39,45,48,52,56,59,63,69],
		'ligaeuropa' => [65],
		'top14' => [13,19,24,29,33,36,41,44,47,51,55,58,62,68],
		'international' => [3,7,11,15,17,26,30,34,42,49,53,60,64,66]
	];

	// Noms des compétitions pour l'affichage
	$competitionNames = [
		'ligue1' => 'Ligue 1',
		'ldc' => 'Ligue des Champions',
		'ligaeuropa' => 'Liga Europa',
		'top14' => 'TOP 14',
		'international' => 'International'
	];

	// ================================================================
	// FONCTION: Extraire l'année depuis le nom de saison
	// ================================================================
	function extractYear($seasonName) {
		if (preg_match('/(\d{4})\s*\/\s*(\d{4})/', $seasonName, $matches)) {
			return $matches[1] . '-' . $matches[2];
		}
		if (preg_match('/(\d{4})/', $seasonName, $matches)) {
			return $matches[1];
		}
		return 'unknown';
	}

	// ================================================================
	// FONCTION: Récupérer les informations d'une saison
	// ================================================================
	function getSeasonInfo($db, $seasonId) {
		global $tableSeasonFound;

		$query = "SELECT id, name FROM $tableSeasonFound WHERE id = $seasonId";
		$result = mysqli_query($db, $query);

		if (!$result || mysqli_num_rows($result) === 0) {
			return null;
		}

		return mysqli_fetch_assoc($result);
	}

	// ================================================================
	// FONCTION: Récupérer le nombre de journées pour une saison
	// ================================================================
	function getMaxWeek($db, $seasonId) {
		global $tableGameFound;

		$query = "SELECT MAX(week) as max_week FROM $tableGameFound WHERE season_id = $seasonId";
		$result = mysqli_query($db, $query);

		if (!$result) {
			return 0;
		}

		$row = mysqli_fetch_assoc($result);
		return (int)$row['max_week'];
	}

	// ================================================================
	// FONCTION: Exporter les pronostics pour une journée
	// ================================================================
	function exportPronosticsForWeek($db, $seasonId, $week, $seasonInfo, $competitionCode, $outputDir) {
		global $config, $tableGameFound, $tablePredictionFound;

		// Extraire l'année depuis le nom de saison
		$year = extractYear($seasonInfo['name']);

		// Créer le nom de fichier
		$filename = sprintf("pronos-%s-%s-j%02d.json", $competitionCode, $year, $week);
		$filepath = $outputDir . '/' . $filename;

		// Vérifier si le fichier existe déjà
		if (file_exists($filepath)) {
			echo "  ✅ déjà traité: $filename\n";
			return ['status' => 'skipped', 'file' => $filename];
		}

		// ÉTAPE 1: Récupérer les matchs de cette journée
		$queryMatches = "SELECT id FROM $tableGameFound
		                 WHERE season_id = $seasonId AND week = $week
		                 ORDER BY id";

		$resultMatches = mysqli_query($db, $queryMatches);

		if (!$resultMatches) {
			echo "  ❌ Erreur SQL (matchs): " . mysqli_error($db) . "\n";
			return ['status' => 'error', 'message' => mysqli_error($db)];
		}

		// Récupérer les IDs des matchs
		$matchIds = [];
		while ($row = mysqli_fetch_assoc($resultMatches)) {
			$matchIds[] = $row['id'];
		}
		mysqli_free_result($resultMatches);

		// Si pas de matchs pour cette journée, on passe
		if (empty($matchIds)) {
			echo "  ⚠️  aucun match: $filename\n";
			return ['status' => 'no_matches', 'file' => $filename];
		}

		// ÉTAPE 2: Récupérer les pronostics pour ces matchs
		$matchIdsStr = implode(',', $matchIds);
		$queryPronos = "SELECT * FROM $tablePredictionFound
		                WHERE game_id IN ($matchIdsStr)
		                ORDER BY submition_date DESC";

		$resultPronos = mysqli_query($db, $queryPronos);

		if (!$resultPronos) {
			echo "  ❌ Erreur SQL (pronostics): " . mysqli_error($db) . "\n";
			return ['status' => 'error', 'message' => mysqli_error($db)];
		}

		// Récupérer tous les pronostics
		$pronostics = [];
		while ($row = mysqli_fetch_assoc($resultPronos)) {
			$pronostics[] = $row;
		}
		mysqli_free_result($resultPronos);

		// Créer la structure JSON (format PHPMyAdmin)
		$jsonData = [
			['type' => 'header', 'version' => '4.9.6', 'comment' => 'Export to JSON plugin for PHPMyAdmin'],
			['type' => 'database', 'name' => $config->db],
			[
				'type' => 'table',
				'name' => $tablePredictionFound,
				'database' => $config->db,
				'data' => $pronostics
			]
		];

		// Écrire le fichier JSON
		$jsonContent = json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		file_put_contents($filepath, $jsonContent);

		echo "  🆕 nouveau: $filename (" . count($matchIds) . " matchs, " . count($pronostics) . " pronostics)\n";

		return [
			'status' => 'exported',
			'file' => $filename,
			'matches' => count($matchIds),
			'count' => count($pronostics)
		];
	}

	// ================================================================
	// SCRIPT PRINCIPAL
	// ================================================================

	echo "📖 Extraction des pronostics par journée...\n\n";

	// Statistiques
	$stats = [
		'total' => 0,
		'exported' => 0,
		'skipped' => 0,
		'no_matches' => 0,
		'errors' => 0
	];

	// Parcourir toutes les compétitions
	foreach ($competitionSeasons as $competitionCode => $seasonIds) {
		$competitionName = $competitionNames[$competitionCode];

		echo "\n";
		echo str_repeat('=', strlen($competitionName) + 4) . "\n";
		echo "  $competitionName\n";
		echo str_repeat('=', strlen($competitionName) + 4) . "\n\n";

		// Parcourir toutes les saisons de cette compétition
		foreach ($seasonIds as $seasonId) {
			// Récupérer les informations de la saison
			$seasonInfo = getSeasonInfo($db, $seasonId);

			if (!$seasonInfo) {
				echo "  ⚠️  Saison ID $seasonId non trouvée dans la base\n";
				continue;
			}

			echo "  {$seasonInfo['name']} (ID: {$seasonId})\n";
			echo "  " . str_repeat('-', strlen($seasonInfo['name']) + 10) . "\n";

			// Récupérer le nombre maximum de journées
			$maxWeek = getMaxWeek($db, $seasonId);

			if ($maxWeek === 0) {
				echo "    ⚠️  Aucune journée trouvée\n\n";
				continue;
			}

			echo "    📊 $maxWeek journée(s) détectée(s)\n";

			// Parcourir toutes les journées
			for ($week = 1; $week <= $maxWeek; $week++) {
				$stats['total']++;

				$result = exportPronosticsForWeek(
					$db,
					$seasonId,
					$week,
					$seasonInfo,
					$competitionCode,
					$outputDir
				);

				if ($result['status'] === 'exported') {
					$stats['exported']++;
				} elseif ($result['status'] === 'skipped') {
					$stats['skipped']++;
				} elseif ($result['status'] === 'no_matches') {
					$stats['no_matches']++;
				} else {
					$stats['errors']++;
				}
			}

			echo "\n";
		}
	}

	// Fermer la connexion
	mysqli_close($db);

	// Afficher les statistiques
	echo "\n";
	echo "========================================\n";
	echo "✅ Extraction terminée !\n";
	echo "========================================\n";
	echo "\n";
	echo "Statistiques:\n";
	echo "  Total journées : {$stats['total']}\n";
	echo "  Nouveaux exports : {$stats['exported']}\n";
	echo "  Déjà traités : {$stats['skipped']}\n";
	echo "  Sans matchs : {$stats['no_matches']}\n";
	echo "  Erreurs : {$stats['errors']}\n";
	echo "\n";
	echo "📁 Fichiers dans: $outputDir/\n";
	echo "\n";

?>
