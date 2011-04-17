<?php

require_once dirname(__FILE__) . '/bootstrap.php';

$query = array(
    'parent.domain' => $_GET['domain']
);

$db     = $client->getDb();
$cursor = $db->log->find($query)
                  ->sort(array('$natural' => -1))
                  ->limit(100);

$log = array();

foreach ($cursor as $document) {
    $log[] = $document;
}

echo json_encode($log);
