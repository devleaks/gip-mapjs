// var chars = "$_!@#%()-12357890abcdefghijklmnopqrstuvwxyz ";
const chars = " 0123456789.:-#ABCDEFGHIJKLMNOPQRSTUVWXYZ_*";
const timing = 60

function flipper (obj) {
 this.obj = obj;
 this.textArray = this.obj.innerHTML.split("");
 this.html = this.obj.innerHTML;
 this.indexes = [];
 this.ia = [];
 this.interval;
 var _this = this;
 
 for (var i = 0; i<this.textArray.length; i++) {
	this.ia.push(0);
	this.indexes.push(i); 
}

	this.start = function () {
		this.timeInt();
	}
	
	this.stop = function () {
		clearInterval(this.interval);
		this.obj.innerHTML = this.html;
	}
	
	this.repaint = function () {
		var txt='';
		for (var i = 0; i<this.ia.length; i++) txt+=chars.charAt(this.ia[i]);
		this.obj.innerHTML=txt;
	}
	
	this.roll = function () {
		
		for(var i = 0; i<this.indexes.length; i++) {
			this.ia[this.indexes[i]]++;
		if (chars.charAt(this.ia[this.indexes[i]]).toUpperCase() === this.textArray[this.indexes[i]].toUpperCase()) this.indexes.splice(i,1);
		}
		

		this.repaint();
		if (this.indexes.length == 0) this.stop();
	}
	
	this.timeInt = function () {
		this.interval=setInterval(function () {_this.roll()},timing);
	}

}