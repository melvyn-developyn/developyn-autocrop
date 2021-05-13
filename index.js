/** Dependencies */
const sizeOf = require('image-size');
const getPixels = require('get-pixels');
const Jimp = require('jimp');

/** Helper Functions */
const calculate_starting_coord = (cx, cy, width) => width * cy + cx;
const get_pixels = img =>
    new Promise((res, rej) =>
        getPixels(img, (err, pixels) => {
            if (err) rej(err);
            else res(pixels.data);
        })
    );
const crop_image = (img, output, { x, y, ex, ey}) =>
    new Promise((res, rej) => 
        Jimp.read(img, (err, image) => {
            if (err) return;
            image.crop(
                x,
                y,
                ex - x,
                ey - y
            )
            .write(output, (err, succ) => {
                if (err) rej(); else res();
            });
        })
    );

/**
 * @param {object}
 * @property {string} input                 - Input image source string
 * @property {string} output                - Cropped image output string
 * @property {object} bgColor               - Object containing rgba properties for the border to crop out (default is 255, 255, 255, 255)
 * @property {number} bgColor.r             - Red intensity 0-255
 * @property {number} bgColor.g             - Green intensity 0-255
 * @property {number} bgColor.b             - Blue intensity 0-255
 * @property {object} options               - Extra options
 * @property {boolean} options.returnArea   - Return the cropped image coordinates, default is false
 */
const autocrop = async ({ input, output, bgColor: {r = 255, g = 255, b = 255, a = 255}, options: { returnArea = false } = {} }) => {
    if (!input || !output) throw new Error('Error - Missing paramaters');

    const pixels = await get_pixels(input); // 1d Array of our pixels e.g. [1, 2, 3, 4] => [R, G, B, A]
    const size = sizeOf(input); // The height/width of our image

    let crop_x_start = 0;
    let crop_x_end = size.width - 1;

    let crop_y_start = 0;
    let crop_y_end = size.height - 1;

    let rows = []; // Used to store all of the rows that are completely white/match the BG Color
    let columns = []; // Same as rows, but for columns that are all the same colour
    
    for (let y = 0; y < size.height; y++) {
        let is_row_matching_bg = true;
        for (let x = 0; x < size.width; x++) {
            let coord = calculate_starting_coord(x, y, size.width)*4;

            if (pixels[coord]   !== r ||
                pixels[coord+1] !== g ||
                pixels[coord+2] !== b ||
                pixels[coord+3] !== a) {
                is_row_matching_bg = false;
            }
        }

        if (is_row_matching_bg) rows.push(y);
    }

    for (let x = 0; x < size.width; x++) {
        let is_col_matching_bg = true;
        for (let y = 0; y < size.height; y++) {
            let coord = calculate_starting_coord(x, y, size.width)*4;

            if (pixels[coord]   !== r ||
                pixels[coord+1] !== g ||
                pixels[coord+2] !== b ||
                pixels[coord+3] !== a) {
                is_col_matching_bg = false;
            }
        }

        if (is_col_matching_bg) columns.push(x);
    }

    if (crop_y_start === rows[0]) {
        for (let [index, r] of rows.entries()) {
            if (index === 0) {
                continue;
            } else if (r === rows[index-1] + 1) {
                crop_y_start = r;
                continue;
            } else {
                break;
            }
        }
    }

    if (crop_y_end === rows[rows.length - 1]) { // If the last row is croppable, figure out how far we can go
        for (let i = rows.length - 1; i > 0; i--) {
            if (i === rows.length - 1) continue;
            if (rows[i] + 1 === rows[i+1]) {
                crop_y_end = rows[i+1];
            }
            else break;
        }
    }

    // If the first column is croppable, figure out how far we can go
    if (crop_x_start === columns[0]) {
        for (let i = 0; i < columns.length; i++) {
            if (i === 0) continue;
            if (columns[i] === columns[i-1] + 1) {
                crop_x_start = columns[i];
            }
            else break;
        }
    }
    
    if (crop_x_end === columns[columns.length - 1]) {
        for (let i = columns.length - 1; i > 0; i--) {
            if (i === columns.length - 1) continue;
            if (columns[i] + 1 === columns[i+1]) {
                crop_x_end = columns[i];
                continue;
            }
            else break;
        }
    }

    await crop_image(
        input,
        output,
        {
            x: crop_x_start,
            ex: crop_x_end,
            y: crop_y_start,
            ey: crop_y_end
        }
    );

    if (returnArea) {
        return {
            crop_x_start,
            crop_x_end,

            crop_y_start,
            crop_y_end
        }
    }
}

module.exports = {
    autocrop
};