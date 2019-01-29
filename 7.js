var cv0 = document.createElement('canvas');
var cv1 = document.getElementById('canvasFront');
var cv = document.getElementById('canvasBack');
var ctx0 = cv0.getContext('2d');
var ctx1 = cv1.getContext('2d');
var ctx = cv.getContext('2d');
rV = ~~( Math.random()*256 );
gV = ~~( Math.random()*256 );
bV = ~~( Math.random()*256 );
cv0.height = cv0.y = window.innerHeight;
cv0.width  = cv0.x = window.innerWidth;
cv1.height = cv1.y = window.innerHeight; 
cv1.width  = cv1.x = window.innerWidth;
cv.height = cv.y = window.innerHeight;
cv.width  = cv.x = window.innerWidth;
cv.s = cv.x + cv.y;
var pixelMultiplier = 20;

xA = new Array ( ~~( cv.x /pixelMultiplier ) );
yA = new Array ( ~~( cv.y /pixelMultiplier ) );
for ( var i=0; i<cv.x /pixelMultiplier; i++) {
	for ( var b=0; b<cv.y /pixelMultiplier; b++) {
		yA[b] = b* pixelMultiplier;
	};
	xA[i] = i* pixelMultiplier;
};

gridtId = "timerId";
tId = "timerId";
pixelTimer = "tId";

var pixel = new Pixel();

/*fit on resize*/
function fitToEdges() {
	cv0.height = cv0.y = window.innerHeight;
	cv0.width  = cv0.x = window.innerWidth;
	cv1.height = cv1.y = window.innerHeight;
	cv1.width  = cv1.x = window.innerWidth;
	cv.height = cv.y = window.innerHeight;
	cv.width  = cv.x = window.innerWidth;
	xA= undefined; yA= undefined; // remake grid
	xA = new Array ( ~~(cv.x /pixelMultiplier) );
	yA = new Array ( ~~(cv.y /pixelMultiplier) );
	for (var i=0; i<cv.x /pixelMultiplier; i++) {
		for (var b=0; b<cv.y /pixelMultiplier; b++) {
			yA[b] = b*pixelMultiplier;
		};
		xA[i] = i*pixelMultiplier;
	};
	drawgrid( pixelMultiplier );
	pixel.x= xA;
	pixel.y= yA;
	drawpixel()
	showHelp();
};

function showHelp() {
	if ( keyH%2 ) {
		ctx1.font="20px Andale Mono";
		ctx1.fillStyle="orange";
		ctx1.fillText("Hello World!"+" help!.",1, 50, cv.x/2 );
		ctx1.fillText("-H key toggle help menu.",1, 70, cv.x/2 );
		ctx1.fillText("-WASD & arrows move pixel.",1, 90, cv.x/2 );
		ctx1.fillText("-tab key toggles auto ball."+tab%2,1, 110, cv.x/2 );
		ctx1.fillText("-1 & 2 inc & dec grid res.",1, 130, cv.x/2 );
		ctx1.fillText("-spacebar and mouseclick is pixel balls.",1, 150, cv.x/2 );
		ctx1.fillText("-mouswheel works on some browsers, it's just a circle...",
			1, 170, cv.x/2 );
		ctx1.fillText("res: "+pixelMultiplier, 1, 190, cv.x/2 );
		ctx1.fillText("res: "+pixelMultiplier, 1, 190, cv.x/2 );
	} else { ctx1.clearRect(0, 0, cv.x/2, cv.y )}
};
/*input events*/
document.addEventListener('mousemove' , captureMouse);
document.addEventListener('mousedown' , clickOn);
document.addEventListener('mousewheel', radius);
var moX, moY;
function captureMouse(e) {
	moX = e.clientX;
	moY = e.clientY;
	drawMousePox();
};
/*KEYS!*/
document.addEventListener('keydown',checkKeyDown,false);
document.addEventListener( 'keyup' ,checkKeyUp  ,false);
tab=0;
keyH=0;
function checkKeyDown(e) {
	var keyID = e.keyCode || e.which;//short x-browser
	if (keyID === 38 || keyID === 87){//up arrow or 'w'
		pixel.keyUp=	true;
		e.preventDefault();
	};
	if (keyID === 39 || keyID === 68){//right arrow or 'd'
		pixel.keyRight=	true;
		e.preventDefault();
	};
	if (keyID === 40 || keyID === 83){//down arrow or 's'
		pixel.keyDown=	true;
		e.preventDefault();
	};
	if (keyID === 37 || keyID === 65){//left arrow or 'a'
		pixel.keyLeft=	true;
		e.preventDefault();
	};
	if (keyID === 32){//spacebar key
		pixel.keySpace=	true;
	};
	if ( keyID === 9 ) {e.preventDefault(); tab++;
	};
	if ( keyID === 49 ) {e.preventDefault(); pixelMultiplier++; 
		fitToEdges(); //key '1'
	};
	if ( keyID === 50 ) {e.preventDefault(); 
		if (pixelMultiplier > 2) {pixelMultiplier--; 
				fitToEdges();} //key '2'
	};
	if ( keyID === 72 ) {keyH++; showHelp(); }
};
function checkKeyUp(e) {
	var keyID=(e.keyCode) ? e.keyCode : e.which;//x-browser
	if (keyID === 38 || keyID === 87) {//up arrow or 'w'
		pixel.keyUp=	false;
		e.preventDefault();
	};
	if (keyID === 39 || keyID === 68) {//right arrow or 'd'
		pixel.keyRight=	false;
		e.preventDefault();
	};
	if (keyID === 40 || keyID === 83) {//down arrow or 's'
		pixel.keyDown=	false;
		e.preventDefault();
	};
	if (keyID === 37 || keyID === 65) {//left arrow or 'a'
		pixel.keyLeft=	false;
		e.preventDefault();
	};
	if (keyID === 32) {//spacebar key
		pixel.keySpace=	false;
	};
};

/*DRAW*/
function drawBackground() {
	ctx0.fillStyle="black";
    ctx0.fillRect(0,0,cv.x,cv.y);
};

var rad = 1;
function radius(e) {
	rad += e.wheelDelta/120; rad = Math.abs(rad); 
	drawMousePox(); return false;
};
function drawMousePox() {
	drawCrc(moX,moY,rad);
	ctx.fillStyle="rgba(50,200,50,1)"
	ctx.fillRect( xA[ ~~(moX /pixelMultiplier) ]+1, 
		yA[ ~~(moY /pixelMultiplier) ]+1, 
		pixelMultiplier-1, pixelMultiplier-1 );
	if (tab%2) {
		new ball( ~~(moX /pixelMultiplier), 
			~~(moY /pixelMultiplier) )
	};
};

function drawCrc(a,b,c) {
	ctx.beginPath();
	ctx.arc(a,b,c,0,7);
	ctx.stroke();
	ctx.closePath();
};

function clickOn() {
	ctx.fillStyle="rgba("+rV+","+gV+","+bV+",.9)";
	new ball ( ~~(moX /pixelMultiplier), ~~(moY /pixelMultiplier) );
	return false; 
};

//grid
function drawgrid(pixelMult) {
	clearInterval(gridtId);
	ctx0.globalAlpha = 0.2;
	drawBackground();

	var sx = ~~( pixelMult*(250/cv.x) );
	var sy = ~~( pixelMult*(250/cv.y) );
	for ( var i=0; i< xA.length; i++ ) {
		for ( var b=0; b< yA.length; b++ ) {
			ctx0.fillStyle = "rgba("+ b*sy +",0,"+ i*sx +",1";
			ctx0.fillRect ( xA[i]+1, yA[b]+1, 
				pixelMult-1, pixelMult-1 ) ;
		};
	};;
	gridtId= setInterval( function refreshGrid() { 
		ctx.drawImage(cv0, 0, 0);
} ,150);
};
drawgrid( pixelMultiplier );

function ball (x, y) {
  this.x = x;
  this.y = y;
  this.gravity = function() {
    if (this.y < yA.length-1 ) {
      this.y++;
    	var rV = ~~( Math.random()*256 );
			var	gV = ~~( Math.random()*256 );
			var	bV = ~~( Math.random()*256 );
    	ctx.fillStyle="rgba("+rV+","+gV+","+bV+",.9)";
    	ctx.fillRect( xA[this.x]+1, yA[this.y]+1, 
    	  pixelMultiplier-1, pixelMultiplier-1 );
    } else {
      clearInterval(this.timer);
      var rV = ~~( Math.random()*256 );
			var	gV = ~~( Math.random()*256 );
			var	bV = ~~( Math.random()*256 );
      ctx1.fillStyle="rgba("+rV+","+gV+","+bV+",1)";
      ctx1.fillRect( xA[this.x]+1, yA[this.y]+1, 
      	pixelMultiplier-1, pixelMultiplier-1 );
    };
  };
  this.timer = setInterval(function() {this.gravity()}.bind(this), 60); //thanks MiJyn =]
};

function Pixel () {
	this.x = xA;
	this.y = yA;
	this.keyUp=	false;
	this.keyDown=	false;
	this.keyLeft=	false;
	this.keyRight=	false;
	this.keySpace=	false;
	this.yy = 0;
	this.xx = 0;
};
Pixel.prototype.draw = function () {
	keyPress();
	ctx.fillStyle="rgba(0,255,0,1)";
	ctx.fillRect ( this.x[ this.xx]+1, this.y[ this.yy]+1, 
		pixelMultiplier-1, pixelMultiplier-1 );
};
function keyPress() {
	if ( pixel.keyUp && pixel.yy > 0 ) {
		pixel.yy--;
	};
	if ( pixel.keyDown && pixel.yy < pixel.y.length-1 ) {
		pixel.yy++;
	};
	if ( pixel.keyLeft && pixel.xx > 0 ) {
		pixel.xx--;
	};
	if ( pixel.keyRight && pixel.xx < pixel.x.length-1 ) {
		pixel.xx++;
	};
	if ( pixel.keySpace ) {
		new ball( pixel.x[ pixel.xx] /pixelMultiplier, 
			pixel.y[ pixel.yy] /pixelMultiplier );
	};
};
function drawpixel(){
	clearInterval(pixelTimer);
	pixelTimer = setInterval( function() { pixel.draw() } , 20 );
};
drawpixel();
