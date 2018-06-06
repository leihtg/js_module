/**
 * tabhost
 */
(function ($) {
	"use strict"
    /**
	 * tab标签
	 * 
	 * @param items
	 * @param initFn
	 */

    $.fn.tabhost = function (items = [], targetDiv, initFn, clickFn) {
        let _this = this, curTab = _this.find('.router-link-exact-active');
        let router={},order=[];
        _this.addClass('navtab');
        items.forEach(t=>{
        	addTab(t);
        })
        
        function tOrder(id,rm=false){
        	let index=order.indexOf(id);
        	if(index>-1){
        		order.splice(index,1);// 删除元素
        	}
        	if(!rm){
        		order.push(id);
        	}
        	console.log(order)
        }
        function closeTab(div,id){
        	div.remove();
        	delete router[id]
        }
        function createCtx(id){
        	let div=targetDiv.find('#'+id);
        	if(div.length>0){
        		return div; 
        	}
        	 div = $(`<div id="${id}" style="margin: 0;padding: 0;"></div>`);
             targetDiv.append(div);
             return div;
        }
        
        function addTab(item){
    		let id=item.target.data('id');
    		if(router[id]){
    			select(id);
    			return;
    		}
        	if(curTab){
        		curTab.removeClass('router-link-exact-active');
        	}
        	let span=$(`<span class="el-tag router-link-exact-active">${item.name}</span>`);
        	if(item.close){
        		span.append('<i class="el-icon-close"></i>');
        	}
        	id=genId();
        	item.target.data('id',id);
        	span.data({'param':item,'id':id});
        	_this.append(span);
        	span.trigger('click');
        	router[id]=span;
        	let div=createCtx(id);
            if ($.isFunction(initFn)) {
                initFn(div, item);
            }
        }
        
        function select(obj){
        	if(router[obj]){
        		router[obj].trigger('click');
        		return;
        	}
        	if(typeof obj === 'number'){
        		_this.find('span').eq(obj).trigger('click');
        		return;
        	}
        }

        _this.on('click', 'span', function (ev) {
            let _t = $(ev.target),id=_t.data('id'),div=targetDiv.find('#'+id);
            
            if(_t.is('i')){// 关闭
            	if(order.length==1){
            		return;
            	}
            	_t=_t.parent('span');
            	id = _t.data('id');
            	_t.remove();
            	div = targetDiv.find('#' + id);
            	closeTab(div,id);
            	tOrder(id,true);
            	select(order.pop());
            	return;
            }
            if (curTab) {
                curTab.removeClass('router-link-exact-active');
            }
            targetDiv.find('#' + curTab.data('id')).hide();            
            curTab=_t.addClass('router-link-exact-active');
            _t.data('id', id);
            div.show();
            if ($.isFunction(clickFn)) {
                clickFn(div, _t.data('param'));
            }
            tOrder(id);// 加入回溯队列
        });
        return {
            select:select,
            addTab:addTab
        }
    };
    /**
	 * 菜单 绑定ul标签
	 */
    $.fn.menu=function(items=[],callback){
    	let _this=this;
    	items.forEach(t=>{
    		let li=renderLi(t,true);
    		li.addClass('nav-item');
    		_this.append(li);
    	});
    	_this.on('click','',function(){
    		
    	});
    }
    
    function renderLi(item,flag){
    	let li=$('<li></li>'),a=$('<a></a>'),span=$('<span></span>');
    	let cs=item.children;
		a.attr('href',item.path||'javascript:;');
		if(cs||flag){
			span.html(item.name);
		}else{
			span=item.name;
		}
		li.append(a.html(span));
		if(cs){
			let ul=$('<ul></ul>');
			li.append(ul);
			renderMenu(cs,ul);
		}
    	return li;
    }
    
    function renderMenu(items,node){
    	for(let it in items){
    		let item=items[it],cs=item.children;
    		let li=renderLi(item,node);
    		node.append(li);
    	}
    	return node;
    }
    /**
	 * 右键菜单
	 * 
	 * @param items
	 * @param clickFn
	 */
    $.fn.ctxMenu = function (items = [], clickFn, preClick) {
        let _this = this;
        let div = $('<div class="ctxMenu"></div>'), ul = $('<ul></ul>');
        for (let it in items) {
            let li = $(`<li>${items[it].name}</li>`);
            ul.append(li);
            li.data('param', items[it]);
            li.contextmenu((e) => {
                e.preventDefault();
            });
        }
        div.append(ul);
        $(document).find('body').append(div);
        _this.contextmenu(function (ev) {
            ev.preventDefault();
            let show = true;
            if ($.isFunction(preClick)) {
                show = preClick();
            }
            if (show) {
                let h = $(window).height(), w = $(window).width();
                let x = ev.pageX, y = ev.pageY;
                let dh = div.height(), dw = div.width();
                if (dh + y > h) {
                    y -= dh;
                }
                if (dw + x > w) {
                    x -= dw;
                }
                div.css({left: x, top: y});
                div.show();
            }
        });
        div.on('click', 'li', function (ev) {
            if ($.isFunction(clickFn)) {
                let t = $(ev.target);
                clickFn(t.data('param'));
                div.hide();
            }
        });
        $(document).on('click', function () {
            if (div) {
                div.hide();
            }
        });
    };

    function genId() {
        return Number(+new Date).toString(16);
    }
}(jQuery));