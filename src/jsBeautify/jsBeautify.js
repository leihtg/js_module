/**
 * jsBeautify.js Create at 2018年1月2日11:02:58
 */
(function(root, factory) {
	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define('beau', [], factory);
	} else if (typeof exports === "object") {
		exports["beau"] = factory();
	} else {
		root["beau"] = factory();
	}
})(this, function() {
	// 需要换行
	var line_start = 'break,case,while,do,if,continue,default,try,throw,var,return,function'.split(',');
	var signs = '! !! % ^ / & | * ( ) || && - = + -- ++ > >> >>> < << >= <= != == === !== += -= %= ^= &=  *= /= , ? :'.split(' ');
	var wordchars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123546789_$'.split('');
	var indent_char = ' ', indent_level = 0, indent_size = 4, indent_string = '';
	var whitespaces = '\t\r\n '.split('');
	var output = [], input, pos = 0, size = 0;

	const TK_WORD = 'TK_WORD';
	const TK_EOF = 'TK_EOF';// 文件末尾
	const TK_START_EXPR = 'TK_START_EXPR';
	const TK_END_EXPR = 'TK_END_EXPR';
	const TK_START_BLOCK = 'TK_START_BLOCK';
	const TK_END_BLOCK = 'TK_END_BLOCK';
	const TK_END_COMAND = 'TK_END_COMAND';
	const TK_COMMENT = 'TK_COMMENT';
	const TK_LINE_START = 'TK_LINE_START';
	const TK_OPERATOR = 'TK_OPERATOR';
	const TK_BLOCK_COMMENT = 'TK_BLOCK_COMMENT';
	const TK_UNKNOWN = 'TK_UNKNOWN';
	const TK_STRING = 'TK_STRING';

	// mode
	const BLOCK = 'BLOCK';// 块
	const EXPRESSION = 'EXPRESSION';// 表达式
	const SWITCH_MODE = 'SWITCH_MODE';

	while (indent_size--) {
		indent_string += indent_char;
	}

	// 输出空格
	function print_space() {
		var lastChar = output[output.length - 1];
		if (' ' != lastChar && '\t' != lastChar) {
			output.push(' ');
		}
	}

	// 新的一行
	function print_newLine() {
		output.push('\n');
		indent();
	}

	function print_token(token) {
		output.push(token);
	}

	// 增加缩进变量
	function indentLevel() {
		indent_level++;
	}

	// 减少缩进变量
	function unIndentLevel() {
		if (indent_level > 0)
			indent_level--;
	}

	// 缩进
	function indent() {
		for (var i = 0; i < indent_level; i++) {
			output.push(indent_string);
		}
	}

	// 去除缩进
	function remove_indent() {
		var last = output.pop();
		if (last && last != indent_string) {
			output.push(last);
		}
	}

	// 设置模式
	function set_mode(mode) {
		modes.push(currentMode);
		currentMode = mode;
	}

	// 恢复上一模式
	function restore_mode() {
		currentMode = modes.pop();
	}

	function in_arr(c, arr) {
		for ( var i in arr) {
			if (c === arr[i]) {
				return true;
			}
		}
		return false;
	}

	// 获取下一个token
	function get_next_token() {
		if (pos >= size) {
			return [ '', TK_EOF ];
		}
		var c = '', token = '', n_lines = 0;
		do {
			c = input.charAt(pos++);
			if (c === '\n') {
				n_lines++;
			}
		} while (in_arr(c, whitespaces));
		token = c;
		if (n_lines > 1) {// 连续多个换行只留一行
			print_newLine();
		}

		if (in_arr(token, wordchars)) {
			if (pos < size) {
				while (in_arr(c = input.charAt(pos), wordchars) && pos++) {
					token += c;
					if (pos == size) {
						break;
					}
				}
			}
			if (token == 'in') {
				return [ token, TK_OPERATOR ];
			}
			return [ token, TK_WORD ];
		}

		switch (token) {
		case '(':
		case '[':
			return [ token, TK_START_EXPR ];
		case ')':
		case ']':
			return [ token, TK_END_EXPR ];
		case '{':
			return [ token, TK_START_BLOCK ];
		case '}':
			return [ token, TK_END_BLOCK ];
		case ';':
			return [ token, TK_END_COMAND ];
		case '/':
			var comment = '';
			if ('*' === input.charAt(pos)) {
				while (++pos < size && !((c = input.charAt(pos)) === '*' && input.charAt(pos + 1) === '/')) {
					comment += c;
				}
				pos += 2;
				return [ '/*' + comment + '*/', TK_BLOCK_COMMENT ];
			} else if ('/' === input.charAt(pos)) {
				while (++pos < size && ((c = input.charAt(pos)) !== '\r' && c !== '\n')) {
					comment += c;
				}
				pos++;
				return [ '//' + comment, TK_COMMENT ];
			}
			break;
		case '"':
		case "'":
			var sep = token, esc = false, doubleEsc = false;
			while ((pos < size) && (esc || (c = input.charAt(pos)) != sep)) {
				pos++;
				if (c == '\\') {// case of '\\'
					doubleEsc = !doubleEsc;
				}
				esc = doubleEsc && (c == '\\' && input.charAt(pos) == sep);
				token += c;
			}
			if (pos < size) {
				token += input.charAt(pos++);
			}
			return [ token, TK_STRING ];
		}
		if (in_arr(token, line_start)) {
			return [ token, TK_LINE_START ];
		}

		if (in_arr(token, signs)) {// 运算符
			while (pos < size && (c = input.charAt(pos))) {
				if (in_arr(token + c, signs)) {
					token += c;
					pos++;
				} else {
					break;
				}
			}
			return [ token, TK_OPERATOR ];
		}

		return [ token, TK_UNKNOWN ];
	}

	var currentMode = BLOCK, modes = [ currentMode ];
	var lastMode, lastToken, in_case = false;

	return function(source) {
		var start = +new Date(), end;
		lastMode = '';
		lastToken = '';
		output = [];
		input = source || '';
		size = input.length;
		indent_level = 0;
		pos = 0;

		while (true) {
			var tokenGroup = get_next_token();
			var token = tokenGroup[0];
			var tokenType = tokenGroup[1];
			if (TK_EOF == tokenType) {
				break;
			}
			switch (tokenType) {
			case TK_OPERATOR:// 运算符
				var start_delim = false, end_delim = false;
				if (token == '--' || token == '++') {
					if (lastToken == ';' || lastMode == TK_OPERATOR) {
						// for(;; ++i)
						start_delim = true;
						end_delim = false;
					} else {
						start_delim = false;
						end_delim = false;
					}
				} else if (token == ',') {
					start_delim = false;
					end_delim = true;
				} else if (token == ':') {
					if (in_case) {
						print_token(token);
						indentLevel();
						print_newLine();
						in_case = false;
						break;
					}
				} else if (lastMode == TK_OPERATOR) {
					start_delim = true;
					end_delim = false;
				} else if (lastMode == TK_START_EXPR) {
					start_delim = false;
					end_delim = false;
				} else if (token == '!' || token == '!!') {
					start_delim = true;
					end_delim = false;
				} else {
					start_delim = true;
					end_delim = true;
				}

				if (start_delim) {
					print_space();
				}
				print_token(token);
				if (end_delim) {
					print_space();
				}
				break;
			case TK_WORD:// 字符
				if (token == 'case' || token == 'default') {
					if (lastToken == ':') {
						/*
						 * case a: case b:
						 */
						unIndentLevel();
						remove_indent();
					} else if (lastToken == '{') {
						print_newLine();
					} else {
						unIndentLevel();
						print_newLine();
					}
					print_token(token);
					in_case = true;
					break;
				} else if (token == 'switch') {
					set_mode(SWITCH_MODE);
				}

				if (lastMode == TK_START_BLOCK) {
					print_newLine();
				} else if (lastMode == TK_END_BLOCK) {
					if (token == 'catch') {
						print_space();
					} else if (token == 'else') {
						print_space();
					} else {
						print_newLine();
					}
				} else if (lastMode == TK_END_EXPR) {
					print_space();
				} else if (lastMode == TK_END_COMAND) {
					if (lastToken == ';' && currentMode == BLOCK) {
						print_newLine();
					} else {
						print_space();
					}
				} else if (lastMode == TK_WORD) {
					print_space();
				}

				print_token(token);
				break;
			case TK_START_EXPR:
				set_mode(EXPRESSION);
				if (lastMode == TK_START_EXPR || lastMode == TK_END_EXPR) {
					// do nothing on ()[]-([
				} else if (lastMode !== TK_OPERATOR && lastMode !== TK_WORD) {
					print_space();
				} else if (in_arr(lastToken, line_start) && lastToken != 'function') {
					print_space();
				}
				print_token(token);
				break;
			case TK_END_EXPR:
				restore_mode();
				print_token(token);
				break;
			case TK_START_BLOCK:
				set_mode(BLOCK);
				if (lastMode == TK_START_EXPR) {

				} else {
					print_space();
				}
				print_token(token);
				indentLevel();
				break;
			case TK_END_BLOCK:
				restore_mode();
				if (currentMode == SWITCH_MODE) {
					restore_mode();
					unIndentLevel();
				}
				unIndentLevel();
				if (lastMode == TK_START_BLOCK || lastMode == TK_END_BLOCK) {
					print_newLine();
				} else {
					print_newLine();
				}
				print_token(token);
				break;
			case TK_STRING:
				if (lastMode == TK_START_BLOCK || lastMode == TK_END_BLOCK) {
					print_newLine();
				} else if (lastMode == TK_WORD) {
					print_space();
				}
				print_token(token);
				break;
			case TK_END_COMAND:
				print_token(token);
				break;
			case TK_BLOCK_COMMENT:
				print_token(token);
				print_newLine();
				break;
			case TK_COMMENT:
				print_token(token);
				print_newLine();
				break;
			default:
				print_token(token);
			}
			lastMode = tokenType;
			lastToken = token;
		}

		var str = output.join('');
		end = +new Date();
		console.log('cost: ' + (end - start));
		return str;
	}
});
