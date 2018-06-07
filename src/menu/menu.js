/**
 * @author leihuating
 * @param root
 * @param factory
 * @returns
 * @time 2018年6月7日9:36:59
 */
(function(root, factory) {
	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = function() {
			return factory(require('jquery'),require('tabhost'));
		};
	} else if (typeof define === "function") {
		define([ 'jquery','tabhost' ], factory);
	} else {
		root["Menu"] = function($) {
			return factory($);
		};
	}
})(this, function($) {
	"use strict"
	/**
	 * options:{
	 * 
	 * ele:'ul',//菜单挂载点
	 * 
	 * items:[],
	 * 
	 * nav:'',//导航位置
	 * 
	 * content:'',//内容 }
	 */
	function Menu(options) {
		if (options === void 0)
			options = {};
		let _this=this;
		this.options = options;
		this.app=$(options.ele);
		this.nav=$(options.nav);
		this.content=$(options.content);
		this.routers={};
		renderMenu(this);
		
		this.tabs=this.nav.tabhost([], this.content, function(div, item) {
				let url=item.hash.substring(2);
				$.post(url, function(resp) {
					div.append(resp);
				});
			});
		function hashLoad(hash){
			let router=_this.routers[hash];
			if(!router)return;
			let ritem=router.item;
			_this.tabs.addTab({
				name:ritem.name,
				id:toHex(hash),
				router:router,
				target:router.target,
				hash:hash,
				close:true
			});
		}
		window.onhashchange=function(ev){
			let url=ev.newURL;
			let hash=url.substring(url.indexOf('#'));
			hashLoad(hash);
		}
		if(location.hash){
			hashLoad(location.hash);
		}else{
			for(let p in _this.routers){
				let c=_this.routers[p];
				if(c.item.actived===true){
					hashLoad(p);
					return;
				}
			}
		}
	}
	function toHex(str){
		let num=0;
		str.split('').forEach(t=>{
			num+=t.codePointAt(0);
		});
		return Number(num).toString(16);
	}
	function renderMenu(menu) {
		(menu.options.items||[]).forEach(it=>{
	 		let li=renderLi(menu,it,true,'#');
    		li.addClass('nav-item');
    		menu.app.append(li);
		});
	}
	
    function clearPath(path=''){
    	return path.replace(/\/\//g,'/');
    }
    
    function renderLi(menu,item,flag,path){
    	let li=$('<li/>'),a=$('<a/>'),span=$('<span/>');
    	let cs=item.children;
    	if(item.path.charAt(0)!='/'){
    		path+='/';
    	}
    	path=clearPath(path+item.path);
    	if(!cs){
    		a.attr('href',path);
    		menu.routers[path]={
    				target:a,
    				item:item
    		};
    	}else{
    		a.attr('href','javascript:;')
    	}
		if(cs||flag){
			span.html(item.name);
		}else{
			span=item.name;
		}
		li.append(a.html(span));
		if(cs){
			let ul=$('<ul/>');
			li.append(ul);
			renderUL(menu,cs,ul,path);
		}
    	return li;
    }
	function renderUL(menu,items, node, path) {
		for ( let it in items) {
			let item = items[it];
			let li = renderLi(menu,item, node, path);
			node.append(li);
		}
		return node;
	}
	
	return Menu;
});