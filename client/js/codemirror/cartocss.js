(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("codemirror/lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["codemirror/lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    var color_keywords = [
        'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige',
        'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown',
        'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
        'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod',
        'darkgray', 'darkgreen', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
        'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
        'darkslateblue', 'darkslategray', 'darkturquoise', 'darkviolet',
        'deeppink', 'deepskyblue', 'dimgray', 'dodgerblue', 'firebrick',
        'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
        'gold', 'goldenrod', 'gray', 'grey', 'green', 'greenyellow', 'honeydew',
        'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
        'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
        'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightpink',
        'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
        'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta',
        'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
        'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
        'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin',
        'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered',
        'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
        'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue',
        'purple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
        'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue',
        'slateblue', 'slategray', 'snow', 'springgreen', 'steelblue', 'tan',
        'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
        'whitesmoke', 'yellow', 'yellowgreen'
    ];

    CodeMirror.defineMode('cartocss', function (config) {
        var indentUnit = config.indentUnit;
        var type;

        function ret (style, tp) {
            type = tp;
            return style;
        }
        // html tags
        var tags = 'a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption cite code col colgroup command datalist dd del details dfn dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins keygen kbd label legend li link map mark menu meta meter nav noframes noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt u ul var video wbr'.split(' ');
        var colorKeywords = keySet(color_keywords);

        function inTagsArray (val) {
            for (var i = 0; i < tags.length; i++) {
                if (val === tags[i]) return true;
            }
        }

        var selectors = /(^\:root$|^\:nth\-child$|^\:nth\-last\-child$|^\:nth\-of\-type$|^\:nth\-last\-of\-type$|^\:first\-child$|^\:last\-child$|^\:first\-of\-type$|^\:last\-of\-type$|^\:only\-child$|^\:only\-of\-type$|^\:empty$|^\:link|^\:visited$|^\:active$|^\:hover$|^\:focus$|^\:target$|^\:lang$|^\:enabled^\:disabled$|^\:checked$|^\:first\-line$|^\:first\-letter$|^\:before$|^\:after$|^\:not$|^\:required$|^\:invalid$)/;

        function tokenBase (stream, state) {
            var ch = stream.next();

            if (ch === '@') {
                stream.eatWhile(/[\w\-]/);
                return ret('meta', stream.current());
            } else if (ch === '/' && stream.eat('*')) {
                state.tokenize = tokenCComment;
                return tokenCComment(stream, state);
            } else if (ch === '<' && stream.eat('!')) {
                state.tokenize = tokenSGMLComment;
                return tokenSGMLComment(stream, state);
            } else if (ch === '=') ret(null, 'compare');
            else if (ch === '|' && stream.eat('=')) return ret(null, 'compare');
            else if (ch === '\'' || ch === '\'') {
                state.tokenize = tokenString(ch);
                return state.tokenize(stream, state);
            } else if (ch === '/') { // e.g.: .png will not be parsed as a class
                if (stream.eat('/')) {
                    state.tokenize = tokenSComment;
                    return tokenSComment(stream, state);
                } else {
                    if (type === 'string' || type === '(') {
                        return ret('string', 'string');
                    }
                    if (state.stack[state.stack.length - 1] !== undefined) {
                        return ret(null, ch);
                    }
                    stream.eatWhile(/[\a-zA-Z0-9\-_.\s]/);
                    if (/\/|\)|#/.test(stream.peek() || (stream.eatSpace() && stream.peek() === ')')) || stream.eol()) {
                        return ret('string', 'string'); // let url(/images/logo.png) without quotes return as string
                    }
                }
            } else if (ch === '!') {
                stream.match(/^\s*\w*/);
                return ret('keyword', 'important');
            } else if (/\d/.test(ch)) {
                stream.eatWhile(/[\w.%]/);
                return ret('number', 'unit');
            } else if (/[,+<>*\/]/.test(ch)) {
                if (stream.peek() === '=' || type === 'a') {
                    return ret('string', 'string');
                }
                return ret(null, 'select-op');
            } else if (/[;{}:\[\]()~\|]/.test(ch)) {
                if (ch === ':') {
                    stream.eatWhile(/[a-z\\\-]/);

                    if (selectors.test(stream.current())) {
                        return ret('tag', 'tag');
                    } else if (stream.peek() === ':') { // ::-webkit-search-decoration
                        stream.next();
                        stream.eatWhile(/[a-z\\\-]/);
                        if (stream.current().match(/\:\:\-(o|ms|moz|webkit)\-/)) {
                            return ret('string', 'string');
                        }
                        if (selectors.test(stream.current().substring(1))) {
                            return ret('tag', 'tag');
                        }
                        return ret(null, ch);
                    } else {
                        return ret(null, ch);
                    }
                } else if (ch === '~') {
                    if (type === 'r') {
                        return ret('string', 'string');
                    }
                } else {
                    return ret(null, ch);
                }
            } else if (ch === '.') {
                if (type === '(' || type === 'string') {
                    return ret('string', 'string'); // allow url(../image.png)
                }
                stream.eatWhile(/[\a-zA-Z0-9\-_]/);
                if (stream.peek() === ' ') {
                    stream.eatSpace();
                }
                if (stream.peek() === ')') {
                    return ret('number', 'unit'); // rgba(0,0,0,.25);
                }
                return ret('tag', 'tag');
            } else if (ch === '#') {
                // we don't eat white-space, we want the hex color and or id only
                stream.eatWhile(/[A-Za-z0-9]/);
                // check if there is a proper hex color length e.g. #eee || #eeeEEE
                if (stream.current().length === 4 || stream.current().length === 7) {
                    if (stream.current().match(/[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/, false) != null) { // is there a valid hex color value present in the current stream
                        // when not a valid hex value, parse as id
                        if (stream.current().substring(1) !== stream.current().match(/[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/, false)) {
                            return ret('atom', 'tag');
                        }
                        // eat white-space
                        stream.eatSpace();
                        // when hex value declaration doesn't end with [;,] but is does with a slash/cc comment treat it as an id, just like the other hex values that don't end with[;,]
                        if (/[\/<>.(){!$%^&*_\-\\?=+\|#'~`]/.test(stream.peek())) {
                            return ret('atom', 'tag');
                        } else if (stream.peek() === '}') {
                            // #time { color: #aaa }
                            return ret('color', 'unit');
                        } else if (/[a-zA-Z\\]/.test(stream.peek())) {
                            // we have a valid hex color value, parse as id whenever an element/class is defined after the hex(id) value e.g. #eee aaa || #eee .aaa
                            return ret('color', 'unit');
                        } else if (stream.eol()) {
                            // when a hex value is on the end of a line, parse as id
                            return ret('color', 'unit');
                        } else {
                            // default
                            return ret('color', 'unit');
                        }
                    } else { // when not a valid hexvalue in the current stream e.g. #footer
                        stream.eatWhile(/[\w\\\-]/);
                        return ret('atom', 'tag');
                    }
                } else { // when not a valid hexvalue length
                    stream.eatWhile(/[\w\\\-]/);
                    return ret('atom', 'tag');
                }
            } else if (ch === '&') {
                stream.eatWhile(/[\w\-]/);
                return ret(null, ch);
            } else {
                stream.eatWhile(/[\w\\\-_%.{]/);
                if (type === 'string') {
                    return ret('string', 'string');
                } else if (stream.current().match(/(^http$|^https$)/) != null) {
                    stream.eatWhile(/[\w\\\-_%.{:\/]/);
                    return ret('string', 'string');
                } else if (stream.peek() === '<' || stream.peek() === '>') {
                    return ret('tag', 'tag');
                } else if (/\(/.test(stream.peek())) {
                    return ret(null, ch);
                } else if (stream.peek() === '/' && state.stack[state.stack.length - 1] !== undefined) { // url(dir/center/image.png)
                    return ret('string', 'string');
                } else if (stream.current().match(/\-\d|\-.\d/)) { // match e.g.: -5px -0.4 etc... only colorize the minus sign
                    // commment out these 2 comment if you want the minus sign to be parsed as null -500px
                    // stream.backUp(stream.current().length-1);
                    // return ret(null, ch); //console.log( stream.current() );
                    return ret('number', 'unit');
                } else if (inTagsArray(stream.current().toLowerCase())) { // match html tags
                    return ret('tag', 'tag');
                } else if (/\/|[\s\)]/.test(stream.peek() || stream.eol() || (stream.eatSpace() && stream.peek() === '/')) && stream.current().indexOf('.') !== -1) {
                    if (stream.current().substring(stream.current().length - 1, stream.current().length) === '{') {
                        stream.backUp(1);
                        return ret('tag', 'tag');
                    } // end if
                    stream.eatSpace();
                    if (/[{<>.a-zA-Z\/]/.test(stream.peek()) || stream.eol()) return ret('tag', 'tag'); // e.g. button.icon-plus
                    return ret('string', 'string'); // let url(/images/logo.png) without quotes return as string
                } else if (stream.eol() || stream.peek() === '[' || stream.peek() === '#' || type === 'tag') {
                    if (stream.current().substring(stream.current().length - 1, stream.current().length) === '{') stream.backUp(1);
                    return ret('tag', 'tag');
                } else if (type === 'compare' || type === 'a' || type === '(') {
                    return ret('string', 'string');
                } else if (type === '|' || stream.current() === '-' || type === '[') {
                    return ret(null, ch);
                } else if (stream.peek() === ':') {
                    stream.next();
                    var t_v = stream.peek() === ':';
                    if (!t_v) {
                        var old_pos = stream.pos;
                        var sc = stream.current().length;
                        stream.eatWhile(/[a-z\\\-]/);
                        var new_pos = stream.pos;
                        if (stream.current().substring(sc - 1).match(selectors) != null) {
                            stream.backUp(new_pos - (old_pos - 1));
                            return ret('tag', 'tag');
                        } else stream.backUp(new_pos - (old_pos - 1));
                    } else {
                        stream.backUp(1);
                    }
                    if (t_v) return ret('tag', 'tag');
                    else return ret('variable', 'variable');

                    // It is a color variable?
                } else if (colorKeywords.hasOwnProperty(stream.current())) {
                    return ret('color', 'unit');
                } else {
                    return ret('variable', 'variable');
                }
            }
        }

        function keySet (array) {
            var keys = {};
            for (var i = 0; i < array.length; ++i) {
                keys[array[i]] = true;
            }
            return keys;
        }

        function tokenSComment (stream, state) { // SComment = Slash comment
            stream.skipToEnd();
            state.tokenize = tokenBase;
            return ret('comment', 'comment');
        }

        function tokenCComment (stream, state) {
            var maybeEnd = false;
            var ch;
            while ((ch = stream.next()) != null) {
                if (maybeEnd && ch === '/') {
                    state.tokenize = tokenBase;
                    break;
                }
                maybeEnd = (ch === '*');
            }
            return ret('comment', 'comment');
        }

        function tokenSGMLComment (stream, state) {
            var dashes = 0;
            var ch;
            while ((ch = stream.next()) != null) {
                if (dashes >= 2 && ch === '>') {
                    state.tokenize = tokenBase;
                    break;
                }
                dashes = (ch === '-') ? dashes + 1 : 0;
            }
            return ret('comment', 'comment');
        }

        function tokenString (quote) {
            return function (stream, state) {
                var escaped = false;
                var ch;
                while ((ch = stream.next()) != null) {
                    if (ch === quote && !escaped) {
                        break;
                    }
                    escaped = !escaped && ch === '\\';
                }
                if (!escaped) state.tokenize = tokenBase;
                return ret('string', 'string');
            };
        }

        return {
            startState: function (base) {
                return {
                    tokenize: tokenBase,
                    baseIndent: base || 0,
                    stack: []
                };
            },

            token: function (stream, state) {
                if (stream.eatSpace()) return null;
                var style = state.tokenize(stream, state);

                var context = state.stack[state.stack.length - 1];
                if (type === 'hash' && context === 'rule') style = 'atom';
                else if (style === 'variable') {
                    if (context === 'rule') style = null; // 'tag'
                    else if (!context || context === '@media{') {
                        style = stream.current() === 'when' ? 'variable'
                            : /[\s,|\s\)|\s]/.test(stream.peek()) ? 'tag' : type;
                    }
                }

                if (context === 'rule' && /^[\{\};]$/.test(type)) {
                    state.stack.pop();
                }
                if (type === '{') {
                    if (context === '@media') state.stack[state.stack.length - 1] = '@media{';
                    else state.stack.push('{');
                } else if (type === '}') state.stack.pop();
                else if (type === '@media') state.stack.push('@media');
                else if (context === '{' && type !== 'comment') state.stack.push('rule');
                return style;
            },

            indent: function (state, textAfter) {
                var n = state.stack.length;
                if (/^\}/.test(textAfter)) {
                    n -= state.stack[state.stack.length - 1] === 'rule' ? 2 : 1;
                }
                return state.baseIndent + n * indentUnit;
            },

            electricChars: '}'
        };
    });

    CodeMirror.defineMIME('text/x-carto', 'cartocss');

});