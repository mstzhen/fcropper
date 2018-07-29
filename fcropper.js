/*!
 * fCropper.js v1.0.1
 *
 * Copyright 2018-present Zhen shigang
 * Released under the MIT license
 *
 * Date: 2018-07-29
 */

(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        (global.fCropper = factory());
}(this, (function() {
    'use strict';
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    function isObject(value) {
        return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value !== null;
    }
    var assign = Object.assign || function assign(obj) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        if (isObject(obj) && args.length > 0) {
            args.forEach(function(arg) {
                if (isObject(arg)) {
                    Object.keys(arg).forEach(function(key) {
                        obj[key] = arg[key];
                    });
                }
            });
        }

        return obj;
    };

    function addEvent(dom, type, handler) {
        if (window.addEventListener) { // Mozilla, Netscape, Firefox 
            dom.addEventListener(type, handler);
        } else if (window.attachEvent) { // IE 
            console.log(type, 7878);
            dom.attachEvent("on" + type, handler);
        } else {
            dom["on" + type] = handler;
        }
    }

    function fCropper(base64) {
        var options = (typeof arguments[1] === "object") ? arguments[1] : "";
        this.DEFAULTS = {
            compressQuerlity: 0.6, //压缩质量
            doc: window.document,
            selector: "#upload",
            clip: "#clip",
            percent: 0.5,
            callBack: function(blog) {
                console.log(blog);
            }

        }
        if (typeof options === "object") {
            this.DEFAULTS = assign({}, this.DEFAULTS, options);
        }
        //保存base64
        this.bbb = base64;
        this.init(base64);

    }
    fCropper.prototype = {
        $$: function(tag) {
            return document.querySelector(tag);
        },
        getTransform: function() {
            var transformDom = this.$$(this.DEFAULTS.selector).querySelector(".cropper-crop-box");
            var x = transformDom.style.transform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px,\s*(\d+)px\)/i)[1] ? transformDom.style.transform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px,\s*(\d+)px\)/i)[1] : 0;
            var y = transformDom.style.transform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px,\s*(\d+)px\)/i)[2] ? transformDom.style.transform.match(/translate3d\((-?\d+)px,\s*(-?\d+)px,\s*(\d+)px\)/i)[2] : 0;

            return {
                x: x,
                y: y
            }
        },
        whichTouch: function(e) {
            var touch;
            if (e.touches) {
                touch = e.touches[0];
            } else {
                touch = e;
            }
            return touch;
        },
        getWidthHeight: function() {
            var transformDom = this.$$(this.DEFAULTS.selector).querySelector(".cropper-crop-box");
            var h = transformDom.style.height;
            var w = transformDom.style.width;
            return {
                h: h,
                w: w
            }
        },
        //base64转为二进制数据，后端可直接利用
        convertBase64UrlToBlob: function(urlData) {
            var arr = urlData.split(','),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            this.DEFAULTS.callBack(new Blob([u8arr], { type: mime }));
        },
        init: function(base64) {
            this.ready(base64);
        },
        ready: function(base64) {
            var EVENT_POINTER_DOWN = 'touchstart mousedown';
            var EVENT_POINTER_MOVE = 'touchmove mousemove';
            var EVENT_POINTER_UP = 'touchend touchcancel mouseup';


            var transformX, //保存transformX样式属性的x
                transformY, //保存transformX样式属性的y
                startX, //保存开始拖动的开始位置X
                startY, //保存开始拖动的开始位置Y
                noMove = false, //是否允许拖动
                noPoint = false, //是否允许扩大选取
                computedimgWH = window.getComputedStyle(this.$$(this.DEFAULTS.selector), null),
                _this = this;

            //初始化模板
            var template = '<div class="cropper-container  cropper-bg" touch-action="none">' + '<div class="cropper-wrap-box">' + '<div class="cropper-canvas"></div>' + '</div>' + '<div class="cropper-drag-box cropper-crop cropper-modal"></div>' + '<div class="cropper-crop-box">' + '<span class="cropper-view-box"></span>' + '<span class="cropper-dashed dashed-h"></span>' + '<span class="cropper-dashed dashed-v"></span>' + '<span class="cropper-center"></span>' + '<span class="cropper-face cropper-move"></span>' + '<span class="cropper-line line-e" data-cropper-action="e"></span>' + '<span class="cropper-line line-n" data-cropper-action="n"></span>' + '<span class="cropper-line line-w" data-cropper-action="w"></span>' + '<span class="cropper-line line-s" data-cropper-action="s"></span>' + '<span class="cropper-point point-e" data-cropper-action="e"></span>' + '<span class="cropper-point point-n" data-cropper-action="n"></span>' + '<span class="cropper-point point-w" data-cropper-action="w"></span>' + '<span class="cropper-point point-s" data-cropper-action="s"></span>' + '<span class="cropper-point point-ne" data-cropper-action="ne"></span>' + '<span class="cropper-point point-nw" data-cropper-action="nw"></span>' + '<span class="cropper-point point-sw" data-cropper-action="sw"></span>' + '<span class="cropper-point point-se" data-cropper-action="se"></span>' + '</div>' + '</div>';

            //辅助div
            var div = document.createElement("div");
            div.innerHTML = template;
            var cropper = div.querySelector(".cropper-crop-box");

            //初始化选区盒子大小和位置
            var initWidth = parseInt(computedimgWH.width) * this.DEFAULTS.percent;
            var initHeight = parseInt(computedimgWH.height) * this.DEFAULTS.percent;
            var initLeftTopx = (parseInt(computedimgWH.width) - initWidth) / 2;
            var initLeftTopy = (parseInt(computedimgWH.height) - initHeight) / 2;
            var leftTopx = initLeftTopx, //左上角顶点的偏移x
                leftTopy = initLeftTopy, //左上角顶点的偏移y
                lastw = initWidth, //拖动结束的选区宽度
                lasth = initHeight; //拖动结束的选区高度
            cropper.style.cssText = "height:" + initHeight + "px;width:" + initWidth + "px;transform: translate3d(" + initLeftTopx + "px," + initLeftTopy + "px, 0px);";


            //.cropper-view-box添加图片
            var img = new Image();
            img.src = base64;
            img.style.cssText = "height:" + parseInt(computedimgWH.height) + "px;width:" + parseInt(computedimgWH.width) + "px;transform: translate3d(" + (-initLeftTopx) + "px," + (-initLeftTopy) + "px, 0px);";
            cropper.querySelector(".cropper-view-box").appendChild(img);

            //6个函数
            var moveAreaStart = function(e) {
                //记录当前位置
                noMove = true;
                var touch = _this.whichTouch(e);
                startY = touch.clientY;
                startX = touch.clientX;
                //获取当前的transform
                transformX = _this.getTransform().x;
                transformY = _this.getTransform().y;
            }　
            var moveAreaMove = function(e) {
                if (noMove) {
                    var transformDom = _this.$$(_this.DEFAULTS.selector).querySelector(".cropper-crop-box");
                    var touch = _this.whichTouch(e);
                    //手势滑动的距离
                    var pageX = touch.clientX - startX;
                    var pageY = touch.clientY - startY;
                    //最大能够滑动到的位置
                    var maxX = parseInt(computedimgWH.width) - lastw; //x最大的位置
                    var maxY = parseInt(computedimgWH.height) - lasth; //y的最大的位置
                    //不做限制实际移动的距离
                    var xx = pageX + parseInt(transformX); //实际移动的距离
                    var yy = pageY + parseInt(transformY); //实际移动的距离
                    //为不超出边界做出的限制

                    xx = xx < 0 ? Math.max(xx, 0) : Math.min(xx, maxX);
                    yy = yy < 0 ? Math.max(yy, 0) : Math.min(yy, maxY);
                    //背景图片移动
                    var imgBack = _this.$$(_this.DEFAULTS.selector).querySelector(".cropper-view-box img");
                    imgBack.style.transform = `translate3d(${-xx}px, ${-yy}px, 0px)`;

                    var transform = `translate3d(${xx}px, ${yy}px, 0px)`;
                    transformDom.style.transform = transform;


                }
            }

            var moveAreaEnd = function(e) {
                noMove = false;
                //记录结束滑动之后的左上角横坐标和纵坐标
                leftTopx = _this.getTransform().x;
                leftTopy = _this.getTransform().y;

            }

            function defaultDoc(obj) {
                var res = _this.DEFAULTS.doc;
                if (typeof window.ontouchstart === "object") {
                    res = obj;
                }
                return res;
            }

            var pointStart = function(e) {
                noPoint = true;
                var touch = _this.whichTouch(e);
                //再次记录开始移动位置
                startY = touch.clientY;
                startX = touch.clientX;
            }

            var pointMove = function(e) {
                if (noPoint) {
                    var transformDom = _this.$$(_this.DEFAULTS.selector).querySelector(".cropper-crop-box");
                    var touch = _this.whichTouch(e);
                    //记录偏移量
                    var pageX = touch.clientX - startX;
                    var pageY = touch.clientY - startY;
                    //操作之后拉伸的宽度和高度
                    var currentH = parseInt(lasth) + pageY; //记录可以拉伸的高度
                    var currentW = parseInt(lastw) + pageX; //记录可以拉伸的宽度

                    //不能超过图片的边界
                    currentW = Math.min(parseInt(computedimgWH.width) - leftTopx, currentW);
                    currentH = Math.min(parseInt(computedimgWH.height) - leftTopy, currentH);
                    //实际的宽度
                    transformDom.style.height = currentH + "px";
                    transformDom.style.width = currentW + "px";
                }
            }

            var pointEnd = function(e) {
                noPoint = false;
                //宽度变化之后move框的大小
                lastw = parseInt(_this.getWidthHeight().w);
                lasth = parseInt(_this.getWidthHeight().h);

            }
            //统一添加事件
            function addListener(element, type, listener) {

                type.trim().split(" ").forEach(function(event) {
                    addEvent(element, event, listener)
                });
            }
            //初始化渲染和事件绑定
            function rederAndBind(base64) {
                var img = new Image();
                img.src = base64;
                var tempDiv = document.createElement("div");
                tempDiv.innerHTML = template;

                var container = tempDiv.querySelector(".cropper-container");
                var oldCropper = tempDiv.querySelector(".cropper-crop-box");
                container.replaceChild(cropper, oldCropper);


                var moveArea = tempDiv.querySelector(".cropper-move");

                addListener(moveArea, EVENT_POINTER_DOWN, moveAreaStart);
                addListener(defaultDoc(moveArea), EVENT_POINTER_MOVE, moveAreaMove);
                addListener(defaultDoc(moveArea), EVENT_POINTER_UP, moveAreaEnd);

                var pointSe = tempDiv.querySelector('.point-se');
                addListener(pointSe, EVENT_POINTER_DOWN, pointStart);
                addListener(defaultDoc(pointSe), EVENT_POINTER_MOVE, pointMove);
                addListener(defaultDoc(pointSe), EVENT_POINTER_UP, pointEnd);
                var oldImg = _this.$$(_this.DEFAULTS.selector).firstChild;

                var oldContainer = _this.$$(_this.DEFAULTS.selector).lastChild;
                if (oldImg) {
                    _this.$$(_this.DEFAULTS.selector).replaceChild(img, oldImg);
                    _this.$$(_this.DEFAULTS.selector).replaceChild(container, oldContainer);

                } else {
                    _this.$$(_this.DEFAULTS.selector).appendChild(img);
                    _this.$$(_this.DEFAULTS.selector).appendChild(container);

                }

            }

            rederAndBind(base64);

            function clip() {
                if (!_this.bbb) {
                    return;
                }
                var sWidth = parseInt(_this.getWidthHeight().w);
                var sHeight = parseInt(_this.getWidthHeight().h);
                var srcX = _this.getTransform().x;
                var srcY = _this.getTransform().y;

                var canvas1 = document.createElement("canvas");
                var cxt1 = canvas1.getContext("2d");
                canvas1.height = parseInt(computedimgWH.height);
                canvas1.width = parseInt(computedimgWH.width);
                var img = new Image();
                img.src = _this.bbb;

                var canvas2 = document.createElement("canvas");
                var cxt2 = canvas2.getContext("2d");
                img.onload = function() {
                    cxt1.drawImage(img, 0, 0, canvas1.height, canvas1.width);
                    var dataImg = cxt1.getImageData(srcX, srcY, sWidth, sHeight);
                    canvas2.width = sWidth;
                    canvas2.height = sHeight;
                    cxt2.putImageData(dataImg, 0, 0, 0, 0, canvas2.width, canvas2.height);
                    var img2 = canvas2.toDataURL("image/png");

                    var _img = new Image();
                    _img.src = img2;
                    _img.onload = function() {
                        // 默认按比例压缩
                        var w = this.width,
                            h = this.height;
                        //生成canvas
                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext('2d');
                        // 创建属性节点
                        var anw = document.createAttribute("width");
                        anw.nodeValue = w;
                        var anh = document.createAttribute("height");
                        anh.nodeValue = h;
                        canvas.setAttributeNode(anw);
                        canvas.setAttributeNode(anh);
                        ctx.drawImage(this, 0, 0, w, h);

                        // quality值越小，所绘制出的图像越模糊
                        var base64 = canvas.toDataURL('image/jpeg', _this.DEFAULTS.compressQuerlity);
                        // 回调函数返回base64的值
                        _this.convertBase64UrlToBlob(base64);
                    }

                }
            }
            this.$$(this.DEFAULTS.selector).querySelector(".cropper-crop-box").addEventListener("dblclick", clip);
            this.$$(this.DEFAULTS.clip).addEventListener("click", clip);

        }

    }
    return fCropper;
})))