<!DOCTYPE html>
<html lang="nl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>El-vis</title>

    <!-- Favicons -->
    <link rel="icon" href="favicon/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png">
    <link rel="shortcut icon" href="favicon/favicon.ico">
    <link rel="manifest" href="favicon/site.webmanifest">

    <!-- Styles -->
    <link rel="stylesheet" href="styles/style.css">
</head>

<body>
<main class="game">
    <canvas class="game__canvas" id="gameCanvas" role="img" aria-label="El-vis game canvas"></canvas>
    <section role="status">
        <div id="notification" class="notification hidden">
            <span id="notification-message"></span>
            <button id="notification-close" class="notification__close">×</button>
        </div>
    </section>
    <ul id="highscoresList" class="highscores"></ul>
</main>

<aside>
    <section class="score score--hidden" aria-live="polite" id="saveScoreContainer">
        <p id="gameOverScore" class="score__text"></p>
        <p id="gameOverHighScore" class="score__text"></p>
        <p id="gameOverHighScoreDate" class="score__text"></p>
        <button class="score__button btn" id="saveScoreBtn">Save Score</button>

        <div class="score__name" id="nameInputContainer">
            <label for="playerName" class="visually-hidden">Enter your name</label>
            <input type="text" class="score__input" id="playerName" placeholder="Your name">
            <button class="score__button btn" id="confirmSaveBtn">Confirm</button>
        </div>

        <button class="score__button btn score__button--hidden" id="playAgainBtn" aria-label="Play again">
            Try again
        </button>
    </section>
</aside>

<section class="intro" id="intro">
    <h3 class="intro__title">El-vis on Tour.</h3>
    <p class="intro__text">
        Click on the screen, or use your spacebar to get started.
        Swim the fish as far as you can without hitting a pillar.
    </p>
</section>

<script type="module" src="scripts/main.js"></script>
</body>

</html>
