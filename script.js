import * as THREE from './lib/three/build/three.module.js'
import { OrbitControls } from './lib/three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from './lib/three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from './lib/three/examples/jsm/loaders/RGBELoader.js'
import * as dat from './lib/dat.gui.module.js'

 let scene,
    camera,
    renderer,
    orbitControl

let clock = new THREE.Clock()

var gui = new dat.GUI()

let currentVideo = 0

var videoTexture
let urls = [
            './models/video/spiderman.mp4',
            './models/video/bb.mp4',
            './models/video/BB2.mp4',
            null
        ]

var screen_material, screen_mesh

const gltfLoader = new GLTFLoader()
const rgbloader = new RGBELoader()

const canvas = document.querySelector('canvas.webgl')

scene  = new THREE.Scene()

camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 100 )
camera.position.x = -0.53
camera.position.y = 0.68
camera.position.z = 1.6
camera.lookAt(0,0.7,0)

/*
const folder = gui.addFolder("camera")
folder.add(camera.position,'x').min(-10).max(10).step(0.01).name('position X')
folder.add(camera.position,'y').min(-10).max(10).step(0.01).name('position Y')
folder.add(camera.position,'z').min(-10).max(10).step(0.01).name('position Z')
*/


scene.add(camera)

renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } )
renderer.setPixelRatio( window.devicePixelRatio )
renderer.physicallyCorrectLights = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.logarithmicDepthBuffer = true
renderer.autoClear = true
renderer.render(scene, camera)


//orbitControl = new OrbitControls(camera, renderer.domElement)
//orbitControl.update()

//Noise texture

let noiseMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
        varying vec2 vUv;

        void main()	{

            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;

        }
    `,
    fragmentShader: `
            
            uniform float time;

            varying vec2 vUv;

            float noise(vec2 coord)
            {
                return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            void main()
            {
                vec2 uv = vUv;
                vec3 color = vec3(0.0);
            
                // TV noise color
                color.r = 0.5 + 0.5 * noise(uv * 10.0 + vec2(time, 0.0));
                color.g = 0.5 + 0.5 * noise(uv * 10.0 + vec2(0.0, time));
                color.b = 0.5 + 0.5 * noise(uv * 10.0 + vec2(time, time));
            
                // Flickering effect
                color *= 0.5 + 0.5 * noise(uv * 30.0 + vec2(time, time));
            
                gl_FragColor = vec4(color, 1.0);
            }
    `,
    uniforms:
       {
           time: { value: 0 },
       }
})

//Creatte video texture
let video = document.getElementById("video")
setVideoTexture(urls)


var videoaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.BackSide
   
})

videoTexture.needsUpdate = true

screen_material = videoaterial


//gltfLoader.load('./models/TV_separate.gltf', gltf => {
gltfLoader.load('./models/scene.gltf', gltf => {
    let model_box = gltf.scene.children[0]
    let model_screen = gltf.scene.children[2]
    let model_table = gltf.scene.children[1]


    model_box.name = "TV"
    model_screen.name = "TV_screen"
    model_table.name = "TV_table"

    model_screen.traverse( function( node ) {
        if (node.material) {
            //node.material = videoaterial
            node.material = screen_material
        }
    })

    model_box.traverse (function (node) {
        if (node.material) {
            node.material.side = THREE.DoubleSide
            node.material.transparent = true
        }
    })

    model_box.traverse( function( node ) {
        if (node.isMesh) {
            node.castShadow = true
            node.receiveShadow = true
        }
    })

    model_table.traverse( function( node ) {
        if (node.isMesh) {
           // node.castShadow = true
            node.receiveShadow = true
        }
    })

    gltf.scene.scale.set(1,1,1)
    screen_mesh = model_screen
   scene.add(model_box, screen_mesh, model_table)
    //scene.add(model_box, model_table)
    
})

rgbloader.load('./models/texture/env/env.pic', texture => {
    texture.encoding = THREE.sRGBEncoding
    texture.mapping = THREE.EquirectangularRefractionMapping
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapP = THREE.RepeatWrapping
    texture.repeat.set( 1, 1 )
    scene.environment = texture
    // scene.background = texture
    
 })
 

 const pointLight = new THREE.PointLight( 0xffffff, 16, 100 )
 pointLight.position.set( 1, 1, 1 )
 pointLight.castShadow = true
 pointLight.shadow.normalBias = 0.05
 scene.add( pointLight )
 
 const sphereSize = 0.2
 const pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
 scene.add( pointLightHelper )

document.addEventListener('mousedown',() => {
    changeMaterial(urls)
});


animate()

function animate(){
    const elapsedTime = clock.getElapsedTime()
    noiseMaterial.uniforms.time.value = elapsedTime
	//orbitControl.update()
	
  //  if(videoTexture != null ) videoTexture.needsUpdate = true
    noiseMaterial.needsUpdate = true
    screen_material.needsUpdate = true
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
} 

function setVideoTexture (videos) {
    
    currentVideo = 0

    video.setAttribute("src", videos[0])
    video.play()

    videoTexture = new THREE.VideoTexture(video)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    if(videoaterial != undefined) {
        videoaterial.needsUpdate = true
    }
    
}

function changeMaterial(videos) {
    let randomIndex = Math.floor(Math.random() * videos.length)
    
    while (randomIndex == currentVideo) {
        randomIndex = Math.floor(Math.random() * videos.length)
    }
    
    currentVideo = randomIndex

    if(videos[randomIndex] == null) {

        screen_mesh.material = noiseMaterial
        videoTexture = null
        videoaterial = null

    } else {
        
        video.setAttribute("src", videos[randomIndex])
        video.play()
        

        videoTexture = new THREE.VideoTexture(video)
        videoTexture.minFilter = THREE.LinearFilter
        videoTexture.magFilter = THREE.LinearFilter

        videoaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.BackSide
           
        })

        screen_mesh.material = videoaterial
        videoaterial.needsUpdate = true
        
    }


}

