const { autocrop } = require('./index.js');

(async () => {
    await autocrop({
        input: './images/precrop-strawberry.jpg',
        output: './images/postcrop-strawberry.jpg',
        bgColor: {
            r: 237,
            g: 237,
            b: 237,
            a: 255
        }
    });
})();