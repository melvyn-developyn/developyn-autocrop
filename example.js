const { autocrop } = require('./index.js');

(async () => {
    await autocrop({
        input: './images/precrop-strawberry.jpg',
        output: './images/postcrop-strawberry.jpg',
        bgColor: {
            r: 255,
            g: 255,
            b: 255,
            a: 255
        }
    });
})();