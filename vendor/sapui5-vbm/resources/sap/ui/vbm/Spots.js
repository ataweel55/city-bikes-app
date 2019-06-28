/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */
sap.ui.define(['./VoAggregation','./library'],function(V,l){"use strict";var S=V.extend("sap.ui.vbm.Spots",{metadata:{library:"sap.ui.vbm",properties:{posChangeable:{type:"boolean",group:"Misc",defaultValue:true},scaleChangeable:{type:"boolean",group:"Misc",defaultValue:true}},defaultAggregation:"items",aggregations:{items:{type:"sap.ui.vbm.Spot",multiple:true,singularName:"item"},dragSource:{type:"sap.ui.vbm.DragSource",multiple:true,singularName:"dragSource"},dropTarget:{type:"sap.ui.vbm.DropTarget",multiple:true,singularName:"dropTarget"}},events:{}}});S.prototype.getBindInfo=function(){var b=V.prototype.getBindInfo.apply(this,arguments);var t=this.getTemplateBindingInfo();b.S=(t)?t.hasOwnProperty("scale"):true;b.I=(t)?t.hasOwnProperty("image"):true;b.IS=(t)?t.hasOwnProperty("imageSelected"):true;b.P=(t)?t.hasOwnProperty("position"):true;b.T=(t)?t.hasOwnProperty("text"):true;b.AL=(t)?t.hasOwnProperty("alignment"):true;b.IC=(t)?t.hasOwnProperty("icon"):true;b.CC=(t)?t.hasOwnProperty("contentColor"):true;b.CO=(t)?t.hasOwnProperty("contentOffset"):true;b.CF=(t)?t.hasOwnProperty("contentFont"):true;b.CS=(t)?t.hasOwnProperty("contentSize"):true;b.Type=(t)?t.hasOwnProperty("type"):true;return b;};S.prototype.getTemplateObject=function(){var t=V.prototype.getTemplateObject.apply(this,arguments);var b=this.mBindInfo=this.getBindInfo();var v=(b.hasTemplate)?this.getBindingInfo("items").template:null;if(b.Type||v.mProperties["type"]!==sap.ui.vbm.SemanticType.None){b.T=b.I=b.CO=b.CC=true;}t["type"]="{00100000-2012-0004-B001-64592B8DB964}";if(b.P){t["pos.bind"]=t.id+".P";}else{t.pos=v.getPosition();}if(b.IC){t["icon.bind"]=t.id+".IC";}else{t.icon=v.getIcon();}if(b.S){t["scale.bind"]=t.id+".S";}else{t.scale=v.getScale();}if(b.IS){t["imageSelected.bind"]=t.id+".IS";}else{t.imageSelected=v.getImageSelected();}if(b.AL){t["alignment.bind"]=t.id+".AL";}else{t.alignment=v.getAlignment();}if(b.CF){t["contentFont.bind"]=t.id+".CF";}else{t.contentFont=v.getContentFont();}if(b.CS){t["contentSize.bind"]=t.id+".CS";}else{t.contentSize=v.getContentSize();}if(b.T){t["text.bind"]=t.id+".T";}else{t.text=v.getText();}if(b.I){t["image.bind"]=t.id+".I";}else{t.image=v.getImage();}if(b.CO){t["contentOffset.bind"]=t.id+".CO";}else{t.contentOffset=v.getContentOffset();}if(b.CC){t["contentColor.bind"]=t.id+".CC";}else{t.contentColor=v.getContentColor();}t["DragSource"]={"DragItem":this.getDragItemTemplate(t.id)};t["DropTarget"]={"DropItem":this.getDropItemTemplate(t.id)};return t;};S.prototype.getTypeObject=function(){var t=V.prototype.getTypeObject.apply(this,arguments);var b=this.mBindInfo;if(b.P){t.A.push({"changeable":this.getPosChangeable().toString(),"name":"P","alias":"P","type":"vector"});}if(b.S){t.A.push({"changeable":this.getScaleChangeable().toString(),"name":"S","alias":"S","type":"vector"});}if(b.T){t.A.push({"name":"T","alias":"T","type":"string"});}if(b.I){t.A.push({"name":"I","alias":"I","type":"string"});}if(b.IS){t.A.push({"name":"IS","alias":"IS","type":"string"});}if(b.AL){t.A.push({"name":"AL","alias":"AL","type":"string"});}if(b.IC){t.A.push({"name":"IC","alias":"IC","type":"string"});}if(b.CC){t.A.push({"name":"CC","alias":"CC","type":"string"});}if(b.CO){t.A.push({"name":"CO","alias":"CO","type":"string"});}if(b.CF){t.A.push({"name":"CF","alias":"CF","type":"string"});}if(b.CF){t.A.push({"name":"CS","alias":"CS","type":"string"});}return t;};S.prototype.getActionArray=function(f){var a=V.prototype.getActionArray.apply(this,arguments);var i=this.getId();if(f||this.mEventRegistry["click"]||this.isEventRegistered("click")){a.push({"id":i+"1","name":"click","refScene":"MainScene","refVO":i,"refEvent":"Click","AddActionProperty":[{"name":"pos"}]});}if(f||this.mEventRegistry["contextMenu"]||this.isEventRegistered("contextMenu")){a.push({"id":i+"2","name":"contextMenu","refScene":"MainScene","refVO":i,"refEvent":"ContextMenu"});}if(f||this.mEventRegistry["drop"]||this.isEventRegistered("drop")){a.push({"id":i+"3","name":"drop","refScene":"MainScene","refVO":i,"refEvent":"Drop"});}return a;};return S;});
