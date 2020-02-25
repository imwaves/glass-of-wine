const $intro = ge('#intro');

ge.call($intro, 'button').addEventListener('click', function (e) {
    $intro.classList.add('--hide');
    $intro.addEventListener('transitionend', function () { 
        $intro.parentNode && $intro.parentNode.removeChild($intro);
        window.orientation != null && document.body.requestFullscreen({ navigationUI: 'hide' });
        setTimeout(Outpour, 1000);
    })
});

function Outpour () {
    var W = Math.min(600, window.innerWidth);
    var H = window.innerHeight;
    var Engine = Matter.Engine,
        Events = Matter.Events,
        Common = Matter.Common,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composites = Matter.Composites,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        World = Matter.World,
        Vertices = Matter.Vertices,
        Bodies = Matter.Bodies;

    var engine = Engine.create(),
        world = engine.world;

    var render = Render.create({
        canvas: ge('canvas'),
        engine: engine,
        options: {
            width: W,
            height: H,
            wireframes: false,
            showDebug: true,
            // background: '#18181d',
            // showAngleIndicator: true
        }
    });

    Render.run(render);

    var runner = Runner.create({ fps: 120 });
    Runner.run(runner, engine);

    // add bodies
    // var stack = Composites.stack(100, 185, 10, 10, 20, 0, function(x, y) {
    //     return Bodies.circle(x, y, 20, {
    //         render: { fillStyle: 'white' },
    //     });
    // });

    engine.world.bounds.max.x = W;
    engine.world.bounds.max.y = H;
    engine.world.gravity.y = 1;
    
    const pad = 25;
    const thick = Math.max(W, H) / 2;
    World.add(world, [
        // walls
        Bodies.rectangle(W/2, -thick/2 +pad, W, thick, { isStatic: true, slop: 0 }),
        Bodies.rectangle(W/2, H +thick/2 -pad, W, thick, { isStatic: true, slop: 0 }),
        Bodies.rectangle(W +thick/2 -pad, H/2, thick, H, { isStatic: true, slop: 0 }),
        Bodies.rectangle(0 -thick/2 +pad, H/2, thick, H, { isStatic: true, slop: 0 }),
        // ...circles
    ]);

    var fps = Infinity;
    var fpsLastTime = Date.now();
    var fpsStop;
    (function checkFps () {
        const time = Date.now();
        fps = 1000 / (time - fpsLastTime);
        fpsLastTime = time;
        if (fpsStop)
            return;
        requestAnimationFrame(checkFps);
    })();

    var MAX_BODIES = 600;
    var TIME_BETWEEN_SPAWN = 20;
    var circles = [];
    setTimeout(() => {
        for (let i = 0; i < MAX_BODIES; i++) {
            (function (i) {
                setTimeout(() => {
                    if (fps < 60)
                    // if (runner.fps < 40)
                        return;
                    World.add(world,
                        new Circle(i)
                        // Bodies.rectangle(pad + rand(W - pad), pad + rand(H - pad), 30, 30, {
                        //     slop: 0,
                        //     density: .0000000001,
                        //     // render: { fillStyle: `rgb(${rand(180, 120)},80,${rand(250, 120)})` },
                        //     render: { fillStyle: `rgb(${ Math.sin(i / 50) * 30 + 174 },130,${ -Math.sin(i / 50) * 30 + 180 })` },
                        // }, 4)
                    )
                }, i * TIME_BETWEEN_SPAWN);
            })(i)
        }

        // setTimeout(() => (fpsStop = true), TIME_BETWEEN_SPAWN * MAX_BODIES);
    }, 50);

    function Circle (i) {
        return Bodies.circle(pad + rand(W - pad), pad + rand(H - pad), 15, {
            slop: 1,
            density: .0000000001,
            friction: .000001,
            // render: { fillStyle: `rgb(${rand(180, 120)},80,${rand(250, 120)})` },
            // render: { fillStyle: `rgb(${ Math.sin(i / 50) * 30 + 174 },130,${ -Math.sin(i / 50) * 30 + 180 })` },
            render: { fillStyle: `rgb(${ Math.sin(i / 50) * 30 + 174 },130,${ -Math.sin(i / 50) * 30 + 180 })` },
        }, 4)
    }

    const $debug = ge('#debug');
    const divPi = 180/Math.PI;
    false && setInterval(() => {
        $debug.innerHTML = `${ fps | 0 } fps; bodies: ${ world.bodies.length }; `;
        // if (ax)
        //     $debug.innerHTML += `\n ${ JSON.stringify(ax) }`
        // if (sensor.quaternion) {
        //     let [x, y, z, w] = sensor.quaternion;
        //     // $debug.innerHTML += JSON.stringify({
        //     //     x: x * divPi, 
        //     //     y: y * divPi, 
        //     //     z: z * divPi,
        //     // });
        //     world.gravity.x
        // }
    }, 500);

    // add mouse control
    var mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 1,
                // damping: .1,
                render: {
                    visible: false
                }
            }
        });

    World.add(world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    var lastBody;
    var scale = 3;
    Events.on(mouseConstraint, 'mousedown', e => {
        const { body } = mouseConstraint;
        if (body && !lastBody) {
            body.vertices = Vertices.scale(body.vertices, scale, scale);
            lastBody = body;
        }
    });

    Events.on(mouseConstraint, 'mouseup', e => {
        const { body } = mouseConstraint;
        if (lastBody) {
            lastBody.vertices = Vertices.scale(lastBody.vertices, 1/scale, 1/scale);
        }
    });
    
    // fit the render viewport to the scene
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: W, y: H }
    });

    var ax;
    var updateGravity = function(event) {
        var orientation = typeof window.orientation !== 'undefined' ? window.orientation : 0,
            gravity = engine.world.gravity;

        ax = event.acceleration;
        if (orientation === 0) {
            gravity.x = Common.clamp(event.gamma, -90, 90) / 90 * 3;
            gravity.y = Common.clamp(event.beta, -90, 90) / 90 * 3;
        } else if (orientation === 180) {
            gravity.x = Common.clamp(event.gamma, -90, 90) / 90 * 3;
            gravity.y = Common.clamp(-event.beta, -90, 90) / 90 * 3;
        } else if (orientation === 90) {
            gravity.x = Common.clamp(event.beta, -90, 90) / 90 * 3;
            gravity.y = Common.clamp(-event.gamma, -90, 90) / 90 * 3;
        } else if (orientation === -90) {
            gravity.x = Common.clamp(-event.beta, -90, 90) / 90 * 3;
            gravity.y = Common.clamp(event.gamma, -90, 90) / 90 * 3;
        }
        gravity.x -= a.x;
        // if (accel.x > 0) accel.x = Math.max(0, accel.x - 1);
        // if (accel.x < 0) accel.x = Math.min(0, accel.x + 1);
        // accel.x /= 1.2;

        gravity.y += a.y;
        // if (accel.y > 0) accel.y = Math.max(0, accel.y - 1);
        // if (accel.y < 0) accel.y = Math.min(0, accel.y + 1);
        // accel.y /= 1.2;

        // var { x, y } = accel;
        // x *= -2;
        // y *= -2;
        // Render.lookAt(render, {
        //     min: { x, y },
        //     max: { x: W + x, y: H + y }
        // });
    };

    window.addEventListener('deviceorientation', updateGravity);

    // window.addEventListener("devicemotion", deviceMotionHandler);
    var a = new LinearAccelerationSensor({frequency: 30});
    a.start();
    // var a = new Accelerometer({frequency: 30});
    var accel = { x: 0, y: 0 };

    // function deviceMotionHandler (e) {
    //     let { x, y } = e.acceleration;
    //     if (Math.abs(y) > Math.abs(accel.y))
    //         accel.y = y * .8;
    //     if (Math.abs(x) > Math.abs(accel.x))
    //         accel.x = x * .8;
    // }


    // const sensorOpts = { frequency: 10, referenceFrame: 'device' };
    // const sensor = new AbsoluteOrientationSensor(sensorOpts);

    // Promise.all([navigator.permissions.query({ name: "accelerometer" }),
    //          navigator.permissions.query({ name: "magnetometer" }),
    //          navigator.permissions.query({ name: "gyroscope" })])
    //    .then(results => {
    //      if (results.every(result => result.state === "granted")) {
    //        sensor.start();
    //      } else {
    //        console.log("No permissions to use AbsoluteOrientationSensor.");
    //      }
    // });
};

function rand (max = 1, min = 0) {
  return min + Math.random() * (max - min)
}

function ge (selector) {
  return (this === window ? document : this).querySelector(selector);
}