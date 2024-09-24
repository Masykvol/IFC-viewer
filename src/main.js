import './style.css'
import './wasm/web-ifc.wasm'
import './wasm/web-ifc-mt.wasm'
import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from "three";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
    width: window.innerWidth,
    height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const aspect = size.width / size.height;
const camera = new PerspectiveCamera(75, aspect);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({
    canvas: threeCanvas,
    alpha: true
});

renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

// Sets up the IFC loading
const ifcLoader = new IFCLoader();
ifcLoader.ifcManager.setWasmPath("wasm/");

const input = document.getElementById("file-input");
input.addEventListener(
    "change",
    async (changed) => {
        const file = changed.target.files[0];
        var ifcURL = URL.createObjectURL(file);
        showLoadingPanel();
        clearScene(); // Очистка сцены перед загрузкой нового файла
        ifcLoader.load(
            ifcURL,
            (ifcModel) => {
                scene.add(ifcModel);
                console.log(ifcModel);
                hideLoadingPanel();
                saveRecentFile(file.name);
            },
            (progress) => {
                updateLoadingProgress(progress);
            }
        );
    },
    false
);

// Sets up the FBX loading
const fbxLoader = new FBXLoader();

function loadFBX(file) {
    const fbxURL = URL.createObjectURL(file);
    showLoadingPanel();
    clearScene(); // Очистка сцены перед загрузкой нового файла
    fbxLoader.load(
        fbxURL,
        (object) => {
            scene.add(object);
            hideLoadingPanel();
            saveRecentFile(file.name);
        },
        (xhr) => {
            updateLoadingProgress(xhr.loaded / xhr.total * 100);
        },
        (error) => {
            console.error('An error happened', error);
            hideLoadingPanel();
        }
    );
}

// Add event listeners to buttons
const ifcButton = document.getElementById("ifc-button");
const fbxButton = document.getElementById("fbx-button");
const clearButton = document.getElementById("clear-button"); // Новая кнопка очистки

ifcButton.addEventListener("click", () => {
    input.accept = ".ifc";
    input.click();
});

fbxButton.addEventListener("click", () => {
    input.accept = ".fbx";
    input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        loadFBX(file);
    }, { once: true });
    input.click();
});

clearButton.addEventListener("click", () => {
    clearScene();
});

// Function to clear the scene
function clearScene() {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    scene.add(grid);
    scene.add(axes);
    scene.add(ambientLight);
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

// Add keyboard controls for WASD movement
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false,
};

document.addEventListener('keydown', (event) => {
    if (event.key === 'w') keys.w = true;
    if (event.key === 'a') keys.a = true;
    if (event.key === 's') keys.s = true;
    if (event.key === 'd') keys.d = true;
    if (event.key === 'Shift') keys.shift = true;
    if (event.key === ' ') keys.space = true;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'w') keys.w = false;
    if (event.key === 'a') keys.a = false;
    if (event.key === 's') keys.s = false;
    if (event.key === 'd') keys.d = false;
    if (event.key === 'Shift') keys.shift = false;
    if (event.key === ' ') keys.space = false;
});

const speed = 0.1;
const fastSpeed = 0.5;

function updateCameraPosition() {
    const moveSpeed = keys.shift ? fastSpeed : speed;
    if (keys.w) camera.position.z -= moveSpeed;
    if (keys.a) camera.position.x -= moveSpeed;
    if (keys.s) camera.position.z += moveSpeed;
    if (keys.d) camera.position.x += moveSpeed;
    if (keys.space) camera.position.y += moveSpeed;
}

// Function to update loading progress
function updateLoadingProgress(progress) {
    if (typeof progress === 'number') {
        const loadingMessage = document.getElementById("loading-message");
        const loadingProgress = document.getElementById("loading-progress");
        loadingMessage.textContent = `Loading... ${progress.toFixed(2)}%`;
        loadingProgress.value = progress;
    }
}

// Function to show the loading panel
function showLoadingPanel() {
    const loadingPanel = document.getElementById("loading-panel");
    loadingPanel.style.display = "flex";
}

// Function to hide the loading panel
function hideLoadingPanel() {
    const loadingPanel = document.getElementById("loading-panel");
    setTimeout(() => {
        loadingPanel.style.display = "none";
    }, 7000);
}

// Function to save recent files
function saveRecentFile(fileName) {
    const recentFilesList = document.getElementById("recent-files-list");
    const listItem = document.createElement("li");
    listItem.textContent = fileName;
    listItem.addEventListener("click", () => {
        // Implement logic to load the recent file
        console.log(`Load recent file: ${fileName}`);
    });
    recentFilesList.appendChild(listItem);
}

// Drag and drop functionality
const dropZone = document.getElementById("drop-zone");

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.style.opacity = 1;
});

dropZone.addEventListener("dragleave", () => {
    dropZone.style.opacity = 0;
});

dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.style.opacity = 0;
    const file = event.dataTransfer.files[0];
    if (file.type === "model/vnd.ifc") {
        loadIFC(file);
    } else if (file.type === "model/vnd.fbx") {
        loadFBX(file);
    }
});

function loadIFC(file) {
    const ifcURL = URL.createObjectURL(file);
    showLoadingPanel();
    clearScene(); // Очистка сцены перед загрузкой нового файла
    ifcLoader.load(
        ifcURL,
        (ifcModel) => {
            scene.add(ifcModel);
            console.log(ifcModel);
            hideLoadingPanel();
            saveRecentFile(file.name);
        },
        (progress) => {
            updateLoadingProgress(progress);
        }
    );
}

// Theme toggle functionality
const themeToggleButton = document.getElementById("theme-toggle");
themeToggleButton.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    document.querySelector(".header").classList.toggle("light-theme");
    document.querySelector(".sidebar").classList.toggle("light-theme");
    document.querySelector(".canvas-container").classList.toggle("light-theme");
    document.querySelector(".loading-panel").classList.toggle("light-theme");
    document.querySelectorAll(".recent-files ul li").forEach(item => {
        item.classList.toggle("light-theme");
    });
});

// Animation loop
const animate = () => {
    updateCameraPosition();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
});
