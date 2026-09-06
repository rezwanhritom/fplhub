<?php
require_once 'google_auth.php'; // Include Google Sheets API setup
require_once 'dbconnect.php'; // Include database connection setup

// Ensure that $service is initialized properly
if (!isset($service)) {
    die("Error: Google Sheets service is not initialized.");
}

// Function to fetch data from Google Sheets
function fetchDataFromSheet($service, $spreadsheetId, $range) {
    echo "Attempting to fetch data from range: " . $range . "\n"; // Debugging
    try {
        $response = $service->spreadsheets_values->get($spreadsheetId, $range);
        $values = $response->getValues();

        if (empty($values)) {
            echo "No data found in the specified range.\n";
            return [];
        } else {
            echo "Fetched data from Google Sheets:\n";
            print_r($values); // Debug: Print fetched data
            return $values;
        }
    } catch (Exception $e) {
        die("Error fetching data from Google Sheets: " . $e->getMessage());
    }
}

// Function to insert data into the FPL_HUB_GW_Data table
function insertFPLHubPlayerData($pdo, $data) {
    echo "Attempting to insert data into database...\n"; // Debugging
    $query = "INSERT INTO fpl_hub_player_data (player_name, player_id, team_name, team_id, pos, web_name, status, 
              news, price, points, form, minutes, goals, assists, cs, saves, yc, rc, tout, tout_event, tin, tin_event, 
              selected_by_percent, cost_change_event, cost_change_event_fall, cost_change_start, 
              cost_change_start_fall, dreamteam_count, ppg, value_form, value_season, influence, creativity, 
              threat, ict_index, influence_rank, influence_rank_type, creativity_rank, creativity_rank_type, 
              threat_rank, threat_rank_type, ict_index_rank, ict_index_rank_type, 
              corners_and_indirect_freekicks_order, direct_freekicks_order, penalties_order, xg_per_90, 
              saves_per_90, xa_per_90, xgi_per_90, xgc_90, gc_per_90, now_cost_rank, now_cost_rank_type, 
              form_rank, form_rank_type, points_per_game_rank, points_per_game_rank_type, selected_rank, 
              selected_rank_type, starts_per_90, cs_per_90, pyfy)
              VALUES (:player_name, :player_id, :team_name, :team_id, :pos, :web_name, :status, :news, :price, 
                      :points, :form, :minutes, :goals, :assists, :cs, :saves, :yc, :rc, :tout, :tout_event, :tin, 
                      :tin_event, :selected_by_percent, :cost_change_event, :cost_change_event_fall, 
                      :cost_change_start, :cost_change_start_fall, :dreamteam_count, :ppg, :value_form, 
                      :value_season, :influence, :creativity, :threat, :ict_index, :influence_rank, 
                      :influence_rank_type, :creativity_rank, :creativity_rank_type, :threat_rank, 
                      :threat_rank_type, :ict_index_rank, :ict_index_rank_type, 
                      :corners_and_indirect_freekicks_order, :direct_freekicks_order, :penalties_order, 
                      :xg_per_90, :saves_per_90, :xa_per_90, :xgi_per_90, :xgc_90, :gc_per_90, :now_cost_rank, 
                      :now_cost_rank_type, :form_rank, :form_rank_type, :points_per_game_rank, 
                      :points_per_game_rank_type, :selected_rank, :selected_rank_type, :starts_per_90, :cs_per_90, :pyfy)
              ON DUPLICATE KEY UPDATE 
                      player_name = VALUES(player_name),
                      team_name = VALUES(team_name),
                      team_id = VALUES(team_id),
                      pos = VALUES(pos),
                      web_name = VALUES(web_name),
                      status = VALUES(status),
                      news = VALUES(news),
                      price = VALUES(price),
                      points = VALUES(points),
                      form = VALUES(form),
                      minutes = VALUES(minutes),
                      goals = VALUES(goals),
                      assists = VALUES(assists),
                      cs = VALUES(cs),
                      saves = VALUES(saves),
                      yc = VALUES(yc),
                      rc = VALUES(rc),
                      tout = VALUES(tout),
                      tout_event = VALUES(tout_event),
                      tin = VALUES(tin),
                      tin_event = VALUES(tin_event),
                      selected_by_percent = VALUES(selected_by_percent),
                      cost_change_event = VALUES(cost_change_event),
                      cost_change_event_fall = VALUES(cost_change_event_fall),
                      cost_change_start = VALUES(cost_change_start),
                      cost_change_start_fall = VALUES(cost_change_start_fall),
                      dreamteam_count = VALUES(dreamteam_count),
                      ppg = VALUES(ppg),
                      value_form = VALUES(value_form),
                      value_season = VALUES(value_season),
                      influence = VALUES(influence),
                      creativity = VALUES(creativity),
                      threat = VALUES(threat),
                      ict_index = VALUES(ict_index),
                      influence_rank = VALUES(influence_rank),
                      influence_rank_type = VALUES(influence_rank_type),
                      creativity_rank = VALUES(creativity_rank),
                      creativity_rank_type = VALUES(creativity_rank_type),
                      threat_rank = VALUES(threat_rank),
                      threat_rank_type = VALUES(threat_rank_type),
                      ict_index_rank = VALUES(ict_index_rank),
                      ict_index_rank_type = VALUES(ict_index_rank_type),
                      corners_and_indirect_freekicks_order = VALUES(corners_and_indirect_freekicks_order),
                      direct_freekicks_order = VALUES(direct_freekicks_order),
                      penalties_order = VALUES(penalties_order),
                      xg_per_90 = VALUES(xg_per_90),
                      saves_per_90 = VALUES(saves_per_90),
                      xa_per_90 = VALUES(xa_per_90),
                      xgi_per_90 = VALUES(xgi_per_90),
                      xgc_90 = VALUES(xgc_90),
                      gc_per_90 = VALUES(gc_per_90),
                      now_cost_rank = VALUES(now_cost_rank),
                      now_cost_rank_type = VALUES(now_cost_rank_type),
                      form_rank = VALUES(form_rank),
                      form_rank_type = VALUES(form_rank_type),
                      points_per_game_rank = VALUES(points_per_game_rank),
                      points_per_game_rank_type = VALUES(points_per_game_rank_type),
                      selected_rank = VALUES(selected_rank),
                      selected_rank_type = VALUES(selected_rank_type),
                      starts_per_90 = VALUES(starts_per_90),
                      cs_per_90 = VALUES(cs_per_90)";
    
    $stmt = $pdo->prepare($query);

    try {
        foreach ($data as $row) {
            $stmt->execute([
                ':player_name' => $row['player_name'],
                ':player_id' => $row['player_id'],
                ':team_name' => $row['team_name'],
                ':team_id' => $row['team_id'],
                ':pos' => $row['pos'],
                ':web_name' => $row['web_name'],
                ':status' => $row['status'],
                ':news' => $row['news'],
                ':price' => $row['price'],
                ':points' => $row['points'],
                ':form' => $row['form'],
                ':minutes' => $row['minutes'],
                ':goals' => $row['goals'],
                ':assists' => $row['assists'],
                ':cs' => $row['cs'],
                ':saves' => $row['saves'],
                ':yc' => $row['yc'],
                ':rc' => $row['rc'],
                ':tout' => $row['tout'],
                ':tout_event' => $row['tout_event'],
                ':tin' => $row['tin'],
                ':tin_event' => $row['tin_event'],
                ':selected_by_percent' => $row['selected_by_percent'],
                ':cost_change_event' => $row['cost_change_event'],
                ':cost_change_event_fall' => $row['cost_change_event_fall'],
                ':cost_change_start' => $row['cost_change_start'],
                ':cost_change_start_fall' => $row['cost_change_start_fall'],
                ':dreamteam_count' => $row['dreamteam_count'],
                ':ppg' => $row['ppg'],
                ':value_form' => $row['value_form'],
                ':value_season' => $row['value_season'],
                ':influence' => $row['influence'],
                ':creativity' => $row['creativity'],
                ':threat' => $row['threat'],
                ':ict_index' => $row['ict_index'],
                ':influence_rank' => $row['influence_rank'],
                ':influence_rank_type' => $row['influence_rank_type'],
                ':creativity_rank' => $row['creativity_rank'],
                ':creativity_rank_type' => $row['creativity_rank_type'],
                ':threat_rank' => $row['threat_rank'],
                ':threat_rank_type' => $row['threat_rank_type'],
                ':ict_index_rank' => $row['ict_index_rank'],
                ':ict_index_rank_type' => $row['ict_index_rank_type'],
                ':corners_and_indirect_freekicks_order' => $row['corners_and_indirect_freekicks_order'],
                ':direct_freekicks_order' => $row['direct_freekicks_order'],
                ':penalties_order' => $row['penalties_order'],
                ':xg_per_90' => $row['xg_per_90'],
                ':saves_per_90' => $row['saves_per_90'],
                ':xa_per_90' => $row['xa_per_90'],
                ':xgi_per_90' => $row['xgi_per_90'],
                ':xgc_90' => $row['xgc_90'],
                ':gc_per_90' => $row['gc_per_90'],
                ':now_cost_rank' => $row['now_cost_rank'],
                ':now_cost_rank_type' => $row['now_cost_rank_type'],
                ':form_rank' => $row['form_rank'],
                ':form_rank_type' => $row['form_rank_type'],
                ':points_per_game_rank' => $row['points_per_game_rank'],
                ':points_per_game_rank_type' => $row['points_per_game_rank_type'],
                ':selected_rank' => $row['selected_rank'],
                ':selected_rank_type' => $row['selected_rank_type'],
                ':starts_per_90' => $row['starts_per_90'],
                ':cs_per_90' => $row['cs_per_90'],
                ':pyfy' => $row['pyfy']
            ]);
        }
        echo "Data successfully inserted into FPL_HUB_Player_Data table.\n";
    } catch (PDOException $e) {
        die("Error inserting data into database: " . $e->getMessage());
    }
}

// Define the spreadsheet ID and range
$spreadsheetId = '1fJg4aZBobJexgs4nTVvOVjnCeekh8aLabJzaMB6BwKQ';
$range = '24/25!A2:BK';

// Fetch data from the Google Sheet
echo "Fetching data from Google Sheets...\n"; // Debugging
$data = fetchDataFromSheet($service, $spreadsheetId, $range);

if (empty($data)) {
    echo "No data retrieved from Google Sheets.\n";
    exit;
}

// Format data for database insertion
$formattedData = [];
foreach ($data as $row) {
    if (isset($row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7], $row[8], $row[9], $row[10], $row[11], $row[12], $row[13], $row[14], $row[15], $row[16], $row[17], $row[18], $row[19], $row[20], $row[21], $row[22], $row[23], $row[24], $row[25], $row[26], $row[27], $row[28], $row[29], $row[30], $row[31], $row[32], $row[33], $row[34], $row[35], $row[36], $row[37], $row[38], $row[39], $row[40], $row[41], $row[42], $row[43], $row[44], $row[45], $row[46], $row[47], $row[48], $row[49], $row[50], $row[51], $row[52], $row[53], $row[54], $row[55], $row[56], $row[57], $row[58], $row[59], $row[60], $row[61], $row[62])) { // Ensure all required fields exist
        $formattedData[] = [
            'player_name' => $row[0],
            'player_id' => $row[1],
            'team_name' => $row[2],
            'team_id' => $row[3],
            'pos' => $row[4],
            'web_name' => $row[5],
            'status' => $row[6],
            'news' => $row[7],
            'price' => $row[8],
            'points' => $row[9],
            'form' => $row[10],
            'minutes' => $row[11],
            'goals' => $row[12],
            'assists' => $row[13],
            'cs' => $row[14],
            'saves' => $row[15],
            'yc' => $row[16],
            'rc' => $row[17],
            'tout' => $row[18],
            'tout_event' => $row[19],
            'tin' => $row[20],
            'tin_event' => $row[21],
            'selected_by_percent' => $row[22],
            'cost_change_event' => $row[23],
            'cost_change_event_fall' => $row[24],
            'cost_change_start' => $row[25],
            'cost_change_start_fall' => $row[26],
            'dreamteam_count' => $row[27],
            'ppg' => $row[28],
            'value_form' => $row[29],
            'value_season' => $row[30],
            'influence' => $row[31],
            'creativity' => $row[32],
            'threat' => $row[33],
            'ict_index' => $row[34],
            'influence_rank' => $row[35],
            'influence_rank_type' => $row[36],
            'creativity_rank' => $row[37],
            'creativity_rank_type' => $row[38],
            'threat_rank' => $row[39],
            'threat_rank_type' => $row[40],
            'ict_index_rank' => $row[41],
            'ict_index_rank_type' => $row[42],
            'corners_and_indirect_freekicks_order' => $row[43],
            'direct_freekicks_order' => $row[44],
            'penalties_order' => $row[45],
            'xg_per_90' => $row[46],
            'saves_per_90' => $row[47],
            'xa_per_90' => $row[48],
            'xgi_per_90' => $row[49],
            'xgc_90' => $row[50],
            'gc_per_90' => $row[51],
            'now_cost_rank' => $row[52],
            'now_cost_rank_type' => $row[53],
            'form_rank' => $row[54],
            'form_rank_type' => $row[55],
            'points_per_game_rank' => $row[56],
            'points_per_game_rank_type' => $row[57],
            'selected_rank' => $row[58],
            'selected_rank_type' => $row[59],
            'starts_per_90' => $row[60],
            'cs_per_90' => $row[61],
            'pyfy' => $row[62] // Add the pyfy field
        ];
    }
}

echo "Formatted data for database:\n";
print_r($formattedData); // Debug: Print formatted data

// Insert data into the database
insertFPLHubPlayerData($pdo, $formattedData);
?>
