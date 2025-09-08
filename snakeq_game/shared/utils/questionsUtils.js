export function generateQuestion(questionSets, questionTypes, gameSettings, usedWords) {
    const difficulty = gameSettings.difficulty;
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const questions = questionSets[difficulty][questionType];

    // filter unused questions
    const unused = questions.filter(
        q => !usedWords[difficulty][questionType].includes(q.question)
    );

    if (unused.length === 0) {
        usedWords[difficulty][questionType] = []; // reset when all are used
    }

    const selected = unused[Math.floor(Math.random() * unused.length)];
    usedWords[difficulty][questionType].push(selected.question);

    // shuffle answer options
    let options = [selected.correct, ...selected.wrong];
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return { 
        question: selected.question, 
        correctAnswer: selected.correct, 
        options 
    };
}