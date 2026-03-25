<?php
return [
    'GET' => [
        '/' => ['HomeController', 'index'],
        '/login' => ['AuthController', 'index'],
        '/scan' => ['ScanController', 'index'],
        '/dashboard' => ['DashboardController', 'index'],
        '/historical' => ['HistoricalController', 'index'],
        '/absent' => ['AbsentController', 'index'],
        '/search' => ['SearchController', 'index'],
        '/gestion' => ['GestionController', 'index'],
    ],
    'POST' => [
        '/login' => ['AuthController', 'verify'],
        '/scan/ajouter' => ['ScanController', 'ajouter'],
        '/search' => ['SearchController', 'search'],
        '/gestion/ajouter' => ['GestionController', 'addStudent'],
        '/gestion/supprimer' => ['GestionController', 'deleteStudent'],
        '/absent/ajouter' => ['AbsentController', 'markAbsent'],
    ]
];
