const glob = require("glob");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const clr = require("colors/safe");

const ICONS_SRC_DIR = 'node_modules/bytesize-icons/dist/icons';
const ICONS_OUT_DIR = 'dist';

// helper
const _generate = (data) => {
    const tpl = _.template(
        fs.readFileSync(path.join(__dirname, '_template/BytesizeIcon.tsx')).toString(),
        { 'variable': 'data' }
    );

    const names = data
        .reduce((memo, row) => {
            memo.push(row[0]);
            return memo;
        }, [])
        .map(v => `'${v}'`)
        .join('\n    | ');

    return tpl({
        ICON_NAMES: names.substr(1, names.length - 2),
        CASES: data.reduce((memo, row) => {
            const name = row[0];
            const svg = row[1];
            memo += `
        case '${name}':
            return (
${mmReplaceMap(svg, {
    'width="32"': 'width={size}',    
    'height="32"': 'height={size}',   
    'stroke-width="2"': 'strokeWidth={strokeWidth}',            
    'stroke-linecap="round"': 'strokeLinecap={strokeLineCap as any}', // ugly
    'stroke-linejoin="round"': 'strokeLinejoin={strokeLineJoin as any}', // ugly
})}
            );
`;
            return memo;
        }, ''),
    });
};

// main runner
(async () => {
    try {
        glob(`${ICONS_SRC_DIR}/*.svg`, async (err, files) => {
            if (err) {
                throw err;
            }

            files.sort();
            let data = [];

            for (let f of files) {
                data.push([path.basename(f, '.svg'), (await fs.readFileSync(f)).toString()]);
            }

            const outfile = path.join(ICONS_OUT_DIR, 'BytesizeIcon.tsx');
            const out = _generate(data).replace('//remove-me//', '');

            await fs.writeFileSync(outfile, out);

            console.log(clr.green(`OK: ${outfile}`));
        });
    } catch (e) {
        console.error(clr.red(e.toString()));
        process.exit(1);
    }
})();

// helpers

function mmReplaceMap(str, map, ignoreCase = false) {
    let patterns = [];
    Object.keys(map).forEach((k) => patterns.push(mmEscapeRegExp(k)));
    let regExp = new RegExp(patterns.join('|'), 'g' + (ignoreCase ? 'i' : ''));
    return str.replace(regExp, (match) => {
        if (ignoreCase) {
            match = match.toLowerCase();
        }
        let replaced = map[match];
        if (replaced === null || replaced === void 0) {
            return '';
        }
        return replaced;
    });
}

function mmEscapeRegExp(str) {
    return (str + '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
