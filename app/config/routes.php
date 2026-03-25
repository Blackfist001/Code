<?php
return [
    'GET' => [
        '/' => ['HomeController', 'index'],
        '/scan' => ['ScanController', 'index'],
        '/historical/{id}' => ['HistoricalController', 'show'], // /{id} récupère l'ID
        '/dashboard' => ['DashboardController', 'index'],
        '/absent' => ['AbsentController', 'index'],
        '/search' => ['SearchController', 'index'],
        '/gestion' => ['GestionController', 'index'],
    ],
    'POST' => [
        '/login' => ['AuthController', 'verify'],
        '/scan/ajouter' => ['ScanController', 'ajouter'],
        '/search' => ['SearchController', 'index'],
        '/gestion/ajouter' => ['GestionController', 'ajouter'],
        '/gestion/supprimer/{id}' => ['GestionController', 'supprimer'], // /{id} pour savoir qui supprimer
    ]
];
