/**************
   VARIABLES
**************/

//canvas dimensions
const canvasMain=
{
    w: window.screen.availWidth * .98,
    h: window.screen.availHeight * .55
};
const canvasStat=
{
    w: 200,
    h: 200,
}

//Object container
const BALLS = [];
const WALLS = [];

//Element assignment
const CTX_MAIN = document.getElementById("main_canvas").getContext("2d");
const CTX_STAT = document.getElementById("stat_canvas").getContext("2d");
const CB_BALL_STATS = document.getElementById("show_ball_stats");
const RDIO_STATE_NORMAL = document.getElementById("normal");
const RDIO_STATE_INTENSE = document.getElementById("intense");

//FPS stuff
var fps =
{
    framesLastSecond: 0,
    currentSecond: 0,
    lastFrameTime: 0,
    currentFrameTime: 0,
    frameCount: 0,
    delta: 0
};

var gameSpeed = 1;
var GAME_STATE_IS_PLAYING = true;
let friction = .96;         // LESS THAN ONE
var numBalls = 50;
var ballSizeRangeLower = 15;
var ballSizeRangeUpper = 50;

//input handler array
let keysDown = {};

/**************
    CLASSES
**************/

//Vector class
class Vector
{
    constructor(x,y)
    {
        this.x = x;
        this.y = y;
    }

    add(v)
    {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    subtract(v)
    {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    magnitude()
    {
        return Math.sqrt(this.x**2 + this.y**2);
    }
    multiply(mult)
    {
        return new Vector(this.x * mult, this.y * mult);
    }
    unit()
    {
        if(this.magnitude() === 0)
        {
            return new Vector(0, 0); 
        }
        else
        {
            return new Vector(this.x/this.magnitude(), this.y/this.magnitude());
        }
    }

    normal()
    {
        return new Vector(-this.y, this.x).unit();
    }

    static dot(v1, v2)
    {
        return v1.x*v2.x + v1.y * v2.y;
    }
    showVector(x1, y1, mult, color)
    {
        CTX_STAT.beginPath();
        CTX_STAT.arc(canvasStat.w/2, canvasStat.h/2, canvasStat.w/2, 0, Math.PI * 2);
        CTX_STAT.strokeStyle = "black";
        CTX_STAT.stroke();

        CTX_STAT.beginPath();
        CTX_STAT.moveTo(x1, y1);
        CTX_STAT.lineTo(x1 + this.x * mult, y1 + this.y * mult);
        CTX_STAT.strokeStyle = color;
        CTX_STAT.stroke();
    }
}

//Ball class
class Ball
{
    constructor(x, y, r, m, e, a, stroke, fill)
    {
        this.pos = new Vector(x,y);
        this.r = r;
        this.m = m;
        if(this.m === 0)
        {
            this.inverse_m = 0;
        }
        else
        {
            this.inverse_m = 1 / this.m;
        }
        this.a = a;
        this.e = e;
        this.acc = new Vector(0, 0);
        this.vel = new Vector(0, 0);
        this.stroke = stroke;
        this.fill = fill;
        this.player = false;
        this.showProperties = false;
        BALLS.push(this);
    }
    
    drawBall()
    {
        CTX_MAIN.beginPath();
        CTX_MAIN.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
        CTX_MAIN.strokeStyle = this.stroke;
        CTX_MAIN.stroke();
        CTX_MAIN.fillStyle = this.fill;
        CTX_MAIN.fill();
        CTX_MAIN.closePath();
        if(this.player)
        {
            CTX_MAIN.fillStyle= this.stroke;
            CTX_MAIN.font = (this.r/2) + "px monospace";
            CTX_MAIN.textBaseline ="middle";
            CTX_MAIN.textAlign = "center";
            CTX_MAIN.fillText("player", this.pos.x, this.pos.y);
        }
        if(this.showProperties)
        {
            CTX_MAIN.fillStyle= this.stroke;
            CTX_MAIN.font = (this.r/4) + "px monospace";
            CTX_MAIN.textAlign = "center";
            CTX_MAIN.fillText("M: " + this.m, this.pos.x, this.pos.y - this.r/2);
            CTX_MAIN.fillText("E: " + this.e, this.pos.x, this.pos.y + this.r/2);
        }
    }

    reposition()
    {
        this.acc = this.acc.unit().multiply(this.a);
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.multiply(friction);
        this.pos = this.pos.add(this.vel);
    }

}

class Wall
{
    constructor(x1, y1, x2, y2)
    {
        this.start = new Vector(x1, y1);
        this.end = new Vector(x2, y2);
        WALLS.push(this);
    }

    drawWall()
    {
        CTX_MAIN.beginPath();
        CTX_MAIN.moveTo(this.start.x, this.start.y);
        CTX_MAIN.lineTo(this.end.x, this.end.y);
        CTX_MAIN.strokeStyle = "black";
        CTX_MAIN.stroke();
    }

    wallUnit()
    {
        return this.end.subtract(this.start).unit();
    }
}
/**************
    EVENTS
**************/

    //keydown
addEventListener("keydown", function(event)
{
    keysDown[event.key] = true;
    console.log(event.key + " was pressed");
});
    //keyup
addEventListener("keyup", function(event)
{
    delete keysDown[event.key];
    console.log(event.key + " was released");
});
    //click down
addEventListener("mousedown", function(event)
{
    keysDown[event.type] = true;
    console.log("mouse was clicked");
});
    //click up
addEventListener("mouseup", function(event)
{
    delete keysDown["mousedown"];
    console.log("mouse was released");
});

//checkbox
CB_BALL_STATS.addEventListener("change", function()
{
    BALLS.forEach((b) => {
        if(CB_BALL_STATS.checked)
        {
            b.showProperties = true;
            document.getElementById("ball_stats_reference").removeAttribute("hidden");
        }
        else
        {
            b.showProperties = false;
            document.getElementById("ball_stats_reference").hidden = true;
        }
    });
});

RDIO_STATE_INTENSE.addEventListener("change", function()
{
    if(RDIO_STATE_INTENSE.checked)
    {
        numBalls = 1000;
        ballSizeRangeLower = 2;
        ballSizeRangeUpper = 5;
        deleteBalls();
        createBalls(numBalls);
        initPlayer();
        BALLS[0].r = 20;
        CB_BALL_STATS.disabled = true;
        document.getElementById("ball_stats_reference").hidden = true;
        CB_BALL_STATS.checked = false;
    }
});

RDIO_STATE_NORMAL.addEventListener("change", function()
{
    if(RDIO_STATE_NORMAL.checked)
    {
        numBalls = 50;
        ballSizeRangeLower = 20;
        ballSizeRangeUpper = 50;
        deleteBalls();
        createBalls(numBalls);
        initPlayer();
        CB_BALL_STATS.disabled = false;
    }
});

/**************
     MAIN
**************/

//Runs once page loaded
window.onload = init();

//Game loop
function gameLoop()
{
    update(fps.delta);
    draw();
    requestAnimationFrame(gameLoop);
}

function draw()
{
    CTX_MAIN.clearRect(0,0, canvasMain.w, canvasMain.h);
    CTX_STAT.clearRect(0,0, canvasStat.w, canvasStat.h);
    drawCanvasBG("white");
    BALLS.forEach((b) => {
        b.drawBall();
        if(b.player)
        {
            drawStats(b);
        }
    });
    WALLS.forEach((w) =>
    {
        w.drawWall();
    });
    drawFrameRate();
}

function update(timeStamp)
{
    calcFrameRate();
    BALLS.forEach((b, index) => {
        if(b.player)
        {
            handleInput(b, timeStamp);
        }
        for(let i = index+1; i < BALLS.length; i++)
        {
            if(circularCollisionDetection(BALLS[index], BALLS[i]))
            {
                circularPenetrationResolution(BALLS[index], BALLS[i]);
                circularCollisionResolution(BALLS[index], BALLS[i]);
            }
        }
        WALLS.forEach((w) =>
        {
            if(circularAndLinearCollisionDetection(BALLS[index], w))
            {
                circularAndLinearPenetrationResolution(BALLS[index], w);
                circularAndLinearCollisionResolution(BALLS[index], w);
            }
        });
        b.reposition();
    });
    
}

/**************
   RENDERING
**************/

//Fill the canvas in with a color
function drawCanvasBG(color)
{
    CTX_MAIN.fillStyle = color;
    CTX_MAIN.fillRect(0, 0, canvasMain.w, canvasMain.h);
    CTX_STAT.fillStyle = color;
    CTX_STAT.fillRect(0, 0, canvasStat.w, canvasStat.h);
}
//Display frame rate
function drawFrameRate()
{
    CTX_STAT.fillStyle= "black";
    CTX_STAT.font = (canvasStat.w * 0.1) + "px monospace";
    CTX_STAT.textAlign = "center";
    CTX_STAT.fillText("FPS: " + Math.floor(fps.framesLastSecond), canvasStat.w/2, canvasStat.h * .8);
}
function drawStats(obj)
{
    obj.vel.showVector(canvasStat.w/2, canvasStat.h/2, canvasStat.w/2, "green");
    obj.acc.unit().showVector(canvasStat.w/2, canvasStat.h/2, canvasStat.w/2, "blue");
    //obj.acc.normal().showVector(canvasStat.w/2, canvasStat.h/2, canvasStat.w/2, "back");
    drawAccStat(obj, "blue");
    drawVelStat(obj, "green");
    drawPosition(obj, "red");
}
function drawAccStat(obj, color)
{
    CTX_STAT.fillStyle= color;
    CTX_STAT.font = (canvasStat.w * 0.04) + "px monospace";
    CTX_STAT.textAlign = "center";
    CTX_STAT.fillText("ACC", canvasStat.w * .1, canvasStat.h * .9, canvasStat.w * .3);
    CTX_STAT.textAlign = "center";
    CTX_STAT.fillText("(" + Math.round(obj.acc.x  * 100) / 100 + "," + Math.round(obj.acc.y  * 100) / 100 + ")", canvasStat.w * .1, canvasStat.h * .95, canvasStat.w * .3)
}
function drawVelStat(obj, color)
{
    CTX_STAT.fillStyle= color;
    CTX_STAT.font = (canvasStat.w * 0.04) + "px monospace";
    CTX_STAT.textAlign = "center";
    CTX_STAT.fillText("VEL", canvasStat.w * .9, canvasStat.h * .9, canvasStat.w * .3);
    CTX_STAT.textAlign = "center";
    CTX_STAT.fillText("(" + Math.round(obj.vel.x + Number.EPSILON * 100) / 10 + "," + Math.round(obj.vel.y + Number.EPSILON * 100) / 10 + ")", canvasStat.w * .9, canvasStat.h * .95, canvasStat.w * .3)
}
function drawPosition(obj, color)
{
    CTX_STAT.fillStyle= color;
    CTX_STAT.font = (canvasStat.w * 0.04) + "px monospace";
    CTX_STAT.textAlign = "center";
    CTX_STAT.fillText("POS", canvasStat.w/2, canvasStat.h * .9, canvasStat.w * .3);
    CTX_STAT.textAlign = "center";
    CTX_STAT.fillText("(" + Math.floor(obj.pos.x) + "," + Math.floor(obj.pos.y) + ")", canvasStat.w/2, canvasStat.h * .95, canvasStat.w * .3)
}
function drawCollision(obj1, obj2)
{
    var tempFill1 = obj1.fill;
    var tempFill2 = obj2.fill;
    
    if(circularCollisionDetection(obj1, obj2))
    {
        obj1.fill = "yellow";
        obj2.fill = "yellow";
    }
    else
    {
        obj1.fill = tempFill1;
        obj2.fill = tempFill2;
    }
}

/**************
   FUNCTIONS
**************/

//make the canvas and start the loop
function init()
{
    document.getElementById("main_canvas").setAttribute("width", canvasMain.w);
    document.getElementById("main_canvas").setAttribute("height", canvasMain.h);
    document.getElementById("stat_canvas").setAttribute("width", canvasStat.w);
    document.getElementById("stat_canvas").setAttribute("height", canvasStat.h);

    createBalls(numBalls);
    BALLS[0].player = true;
    BALLS[0].r = 50;
    if(BALLS[0].m == 0)
    {
        BALLS[0].m += 1;
    }
    var topWall = new Wall(0,0, canvasMain.w, 0);
    var rightWall = new Wall(canvasMain.w, 0, canvasMain.w, canvasMain.h);
    var bottomWall = new Wall(0, canvasMain.h, canvasMain.w, canvasMain.h);
    var leftWall = new Wall(0, 0, 0, canvasMain.h);
    gameLoop();
}

//Calculate the frame rate
function calcFrameRate()
{
    fps.currentFrameTime = Date.now();
    fps.delta = fps.currentFrameTime - fps.lastFrameTime;
    fps.delta = Math.min(fps.delta, gameSpeed);
    var sec = Math.floor(Date.now() / 1000);

    if(sec != fps.currentSecond)
    {
        fps.currentSecond = sec;
        fps.framesLastSecond = fps.frameCount;
        fps.frameCount = 1;
    }
    else
    {
        fps.frameCount++;
    }
}

function handleInput(obj, timeStamp)
{
    //UP
    if(('w' in keysDown || 'W' in keysDown) && GAME_STATE_IS_PLAYING)
    {
        obj.acc.y = -obj.a;
        
    }
    //LEFT
    if(('a' in keysDown || 'A' in keysDown) && GAME_STATE_IS_PLAYING)
    {
        obj.acc.x = -obj.a;
    }
    //DOWN
    if(('s' in keysDown || 'S' in keysDown) && GAME_STATE_IS_PLAYING)
    {
        obj.acc.y = obj.a;
    }
    //RIGHT
    if(('d' in keysDown || 'D' in keysDown) && GAME_STATE_IS_PLAYING)
    {
        obj.acc.x = obj.a;     
    }
    //NO X-AXIS PRESSED
    if(!('a' in keysDown) && !('A' in keysDown) && !('d' in keysDown) && !('D' in keysDown))
    {
        obj.acc.x = 0;
    }
    //NO Y-AXIS PRESSED
    if(!('s' in keysDown) && !('S' in keysDown) && !('w' in keysDown) && !('W' in keysDown))
    {
        obj.acc.y = 0;
    }
    // if('mousedown' in keysDown && GAME_STATE_IS_PLAYING)
    // {

    // }
}

function circularCollisionDetection(obj1, obj2)
{
    if(obj1.r + obj2.r >= obj2.pos.subtract(obj1.pos).magnitude())
    {
        return true;
    }
    else
    {
        return false;
    }
}

function circularPenetrationResolution(obj1, obj2)
{
    let distance = obj1.pos.subtract(obj2.pos);
    let penetrationDepth = obj1.r + obj2.r - distance.magnitude();
    let penetrationResolution = distance.unit().multiply(penetrationDepth/(obj1.inverse_m + obj2.inverse_m));
    obj1.pos = obj1.pos.add(penetrationResolution.multiply(obj1.inverse_m));
    obj2.pos = obj2.pos.add(penetrationResolution.multiply(-obj2.inverse_m));
}

function circularCollisionResolution(obj1, obj2)
{
    let normal = obj1.pos.subtract(obj2.pos).unit();
    let relativeVelocity = obj1.vel.subtract(obj2.vel);
    let separatingVelocity = Vector.dot(relativeVelocity, normal);
    let newSeparatingVelocity = -separatingVelocity * Math.min(obj1.e, obj2.e);

    let separatingVelocityDifference = newSeparatingVelocity - separatingVelocity;
    let impulse = separatingVelocityDifference / (obj1.inverse_m + obj2.inverse_m);
    let impulseVector = normal.multiply(impulse);
    

    obj1.vel = obj1.vel.add(impulseVector.multiply(obj1.inverse_m));
    obj2.vel = obj2.vel.add(impulseVector.multiply(-obj2.inverse_m));
}

function circularAndLinearCollisionDetection(obj, wall)
{
    let circleToClosest = closestPoint(obj, wall).subtract(obj.pos);
    if(circleToClosest.magnitude() <= obj.r)
    {
        return true;
    }
}

function circularAndLinearPenetrationResolution(obj, wall)
{
    let penetrationVector = obj.pos.subtract(closestPoint(obj, wall));
    obj.pos = obj.pos.add(penetrationVector.unit().multiply(obj.r - penetrationVector.magnitude()));
}

function circularAndLinearCollisionResolution(obj, wall)
{
    let normal = obj.pos.subtract(closestPoint(obj, wall)).unit();
    let separatingVelocity = Vector.dot(obj.vel, normal);
    let newSeparatingVelocity = -separatingVelocity * obj.e;
    let separatingVelocityDifference = separatingVelocity - newSeparatingVelocity;
    obj.vel = obj.vel.add(normal.multiply(-separatingVelocityDifference));
}

function closestPoint(obj, wall)
{
    let circleToWallStart = wall.start.subtract(obj.pos);
    if(Vector.dot(wall.wallUnit(), circleToWallStart) > 0)
    {
        return wall.start;
    }

    let wallEndToCircle = obj.pos.subtract(wall.end);
    if(Vector.dot(wall.wallUnit(), wallEndToCircle) > 0)
    {
        return wall.end;
    }

    let closestDistance = Vector.dot(wall.wallUnit(), circleToWallStart);
    let closestVector = wall.wallUnit().multiply(closestDistance);
    return wall.start.subtract(closestVector);
}

function randomInteger(min, max)
{
    return Math.floor(Math.random() * (max-min+1)) + min;
}

function randomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  

function createBalls(num)
{
    for(let i = 0; i < num; i++)
    {
        var tempStroke = randomColor();
        var tempFill = randomColor();
        let newBall = new Ball(randomInteger(0, canvasMain.w), randomInteger(0, canvasMain.h), randomInteger(ballSizeRangeLower, ballSizeRangeUpper), randomInteger(0, 50), randomInteger(0,10)/5, 1, tempStroke, tempFill);
        
    }
}

function deleteBalls()
{
    BALLS.splice(0, BALLS.length);
}

function initPlayer()
{
    BALLS[0].player = true;
    if(BALLS[0].m < 1)
    {
        BALLS[0].m = 1;
    }
}