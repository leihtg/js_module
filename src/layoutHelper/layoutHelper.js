/**
 * layout helper
 *
 * @author leihuating
 *
 */
;
(function ($) {
    const KCODE = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        INSERT: 45,
        DELETE: 46,
        CTRL: 17
    }, SELECTED_CSS = 'over', DUR_TIME = 500/*(ms)双击间隔时间*/;
    /**
     * 去除属性内容{'属性值':[内容,'']},属性值是数组
     * 去除属性{'属性值':true}
     * 可以使用正则表达式(须是全匹配,否则不准)
     */
    const excludeAttrs = {
        '^class$': [SELECTED_CSS],//去除属性内容
        '^jqc.*$': true,//去除属性
        '^contenteditable$': true,
    };
    let ctrl = false;
    $.fn.extend({
        computerSize: function () {
            let obj = $(this), textarea = $('<textarea readonly>'), target = null, tlist = [], tmp;
            let edit = $('<button>编辑</button>');
            // 创建css样式
            $('<style>.'.concat(SELECTED_CSS, '{outline: red dashed;}</style>')).appendTo('head');
            this.parent().append(edit).append(textarea);
            edit.click(function (ev) {
                let _t = $(ev.target);
                if ('编辑' == _t.text()) {
                    obj.hide();
                    genHTML(obj, textarea);
                    textarea.removeAttr('readonly');
                    _t.text('保存');
                } else {
                    _t.text('编辑');
                    obj.html(textarea.val());
                    obj.show();
                    textarea.attr('readonly', 'readonly');
                }
            });
            obj.off('click.layout').on('click.layout', 'div.row>div', function (e) {
                if (tlist.length > 0 && !ctrl) {
                    while (tmp = tlist.pop())
                        tmp.removeClass(SELECTED_CSS);
                }
                target = $(e.target).closest('div[class!=row]');
                let time = target.data('time');
                console.log(+new Date - time);
                if (time && (+new Date - time < DUR_TIME)) {
                    target.attr('contenteditable', true).off('blur.layout change.layout').on({
                        'blur.layout': (ev) => {
                            $(ev.target).removeAttr('contenteditable')
                        }
                    });
                }
                target.data('time', +new Date);

                if (!target.parent('div').hasClass('row')) {
                    target = null;
                    return;
                }
                if (target.hasClass(SELECTED_CSS)) {
                    target.removeClass(SELECTED_CSS);
                    return;
                }
                target.addClass(SELECTED_CSS);
                let cstr = target.attr('class');
                if (cstr) {
                    let hc = [], nc = [];
                    cstr.split(' ').forEach(function (v) {
                        if (!v.match(/^col-/)) {
                            nc.push(v);
                        } else {
                            hc.push(v);
                        }
                    });
                    if (hc.length <= 0) {
                        hc.push('col-md-1 col-lg-1');
                    }
                }
                tlist.push(target);

                $(document).off('keydown.layout keyup.layout').on({
                    'keydown.layout': function (e) {
                        let start = +new Date;
                        ctrl = false;
                        let _tlist = obj.find('.' + SELECTED_CSS);
                        if (_tlist.length <= 0)
                            return;
                        let size = 0, offset = 0;
                        switch (e.keyCode) {
                            case KCODE.LEFT:
                            case KCODE.DOWN:
                                size = -1;
                                break;
                            case KCODE.UP:
                            case KCODE.RIGHT:
                                size = 1;
                                break;
                            case KCODE.INSERT: // insert
                                offset = 1;
                                break;
                            case KCODE.DELETE: // delete
                                offset = -1;
                                break;
                            case KCODE.CTRL: // ctrl
                                ctrl = true;
                                return;
                            default:
                                return;
                        }
                        for (let j = 0; j < _tlist.length; j++) {
                            let arr = [],
                                _size = size,
                                _offset = offset;
                            let _target = $(_tlist[j]);
                            (_target.attr('class') || '').split(' ').forEach(function (c) {
                                if (c.match(/^col-/)) {
                                    let num = 0, mN = c.match(/(\d+)/);
                                    if (mN) {
                                        num = +mN[1];
                                    }
                                    if (c.match(/offset-/)) {
                                        _offset = offset + num;
                                    } else {
                                        _size = size + num;
                                    }
                                } else {
                                    arr.push(c);
                                }

                            });

                            let cstr = '';
                            if ((size && _size > 0) || _size > 0) {
                                cstr = cstr.concat(`col-md-${_size} col-lg-${_size}`);
                            }
                            if ((offset && _offset > 0) || _offset > 0) {
                                if (cstr) {
                                    cstr = cstr.concat(' ');
                                }
                                cstr = cstr.concat(`col-md-offset-${_offset} col-lg-offset-${_offset}`);
                            }
                            arr.unshift(cstr);
                            _target.attr('class', arr.join(' '));
                        }
                        //生成html
                        genHTML(obj, textarea);

                        console.log('cost: ' + (+new Date - start) + '(ms)');
                    },
                    'keyup.layout': function (e) {
                        ctrl = false;
                    }
                });
            }).off('keyup.layout').on('keyup.layout',()=>{
                genHTML(obj, textarea);
            });
        }
    });

    /**
     * 生成html
     * @param ctx
     * @param textarea
     */
    function genHTML(ctx, textarea) {
        let _obj = $(ctx).clone();
        _obj.find('*').each(removeProp);
        textarea.val(_obj.html());
    }

    /**
     * 去除无用的属性值
     * @param index
     * @param obj
     */
    function removeProp(index, obj) {
        let _o = $(obj), attrs = obj.attributes;
        let rm_attrs = [];
        for (let i = 0; i < attrs.length; i++) {
            let attr = attrs[i], name = attr.nodeName, value = attr.nodeValue;
            for (let p in excludeAttrs) {
                let pv = excludeAttrs[p];
                if (new RegExp(p, 'g').test(name)) {
                    if (pv === true) {
                        rm_attrs.push(name);
                    } else if ($.isArray(pv)) {
                        let attr_vals = [];
                        pv.forEach(t => {
                            value.split(' ').forEach(v => {
                                if (!new RegExp(v, 'g').test(t)) {
                                    attr_vals.push(v);
                                }
                            });
                        });
                        _o.attr(name, attr_vals.join(' '));
                    }
                }
            }
        }
        _o.removeAttr(rm_attrs.join(' '));
    }
})(jQuery);