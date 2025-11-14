import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import Stats from "three/addons/libs/stats.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DynamicBones } from "./dynamicbones.mjs";
const workletUrl = new URL("./playback-worklet.js", import.meta.url);

const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v = new THREE.Vector3();
const w = new THREE.Vector3();
const box = new THREE.Box3();
const axisx = new THREE.Vector3(1, 0, 0);

class TalkingHead {
  constructor(node, opt = null) {
    this.nodeAvatar = node;
    this.opt = {
      jwtGet: null, // Function to get JSON Web Token
      ttsEndpoint: null,
      ttsApikey: null,
      ttsTrimStart: 0,
      ttsTrimEnd: 400,
      ttsLang: "fi-FI",
      ttsVoice: "fi-FI-Standard-A",
      ttsRate: 1,
      ttsPitch: 0,
      ttsVolume: 0,
      mixerGainSpeech: null,
      mixerGainBackground: null,
      lipsyncLang: "fi",
      lipsyncModules: ["fi", "en", "lt"],
      pcmSampleRate: 22050,
      modelRoot: "Armature",
      modelPixelRatio: 1,
      modelFPS: 30,
      modelMovementFactor: 1,
      cameraView: "full",
      dracoEnabled: true,
      dracoDecoderPath: "https://www.gstatic.com/draco/v1/decoders/",
      cameraDistance: 0,
      cameraX: 0,
      cameraY: 0,
      cameraRotateX: 0,
      cameraRotateY: 0,
      cameraRotateEnable: true,
      cameraPanEnable: false,
      cameraZoomEnable: false,
      lightAmbientColor: 0xeeeeee,
      lightAmbientIntensity: 3,
      lightDirectColor: 0xffffff,
      lightDirectIntensity: 4,
      lightDirectPhi: 1,
      lightDirectTheta: 2,
      lightSpotIntensity: 0,
      lightSpotColor: 0x3388ff,
      lightSpotPhi: 0.1,
      lightSpotTheta: 4,
      lightSpotDispersion: 1,
      avatarMood: "neutral",
      avatarMute: false,
      avatarIdleEyeContact: 0.2,
      avatarIdleHeadMove: 0.5,
      avatarSpeakingEyeContact: 0.5,
      avatarSpeakingHeadMove: 0.5,
      avatarIgnoreCamera: false,
      listeningSilenceThresholdLevel: 40,
      listeningSilenceThresholdMs: 2000,
      listeningSilenceDurationMax: 10000,
      listeningActiveThresholdLevel: 75,
      listeningActiveThresholdMs: 300,
      listeningActiveDurationMax: 240000,
      statsNode: null,
      statsStyle: null,
      enableStrongLight: false,
    };
    Object.assign(this.opt, opt || {});
    // Statistics
    if (this.opt.statsNode) {
      this.stats = new Stats();
      if (this.opt.statsStyle) {
        this.stats.dom.style.cssText = this.opt.statsStyle;
      }
      this.opt.statsNode.appendChild(this.stats.dom);
    }

    // Pose templates
    // NOTE: The body weight on each pose should be on left foot
    // for most natural result.
    this.poseTemplates = opt.poseTemplates;

    // Gestures
    // NOTE: For one hand gestures, use left left
    this.gestureTemplates = {
      handup: {
        "LeftShoulder.rotation": { x: [1.5, 2, 1, 2], y: [0.2, 0.4, 1, 2], z: [-1.5, -1.3, 1, 2] },
        "LeftArm.rotation": { x: [1.5, 1.7, 1, 2], y: [-0.6, -0.4, 1, 2], z: [1, 1.2, 1, 2] },
        "LeftForeArm.rotation": { x: 1, y: [0.5, 0, 1, 2], z: 1.575 },
        "LeftHand.rotation": { x: 0.529, y: -0.2, z: -0.022 },
        "LeftHandThumb1.rotation": { x: -0.1, y: 0.5, z: 0 },
        "LeftHandThumb2.rotation": { x: 1.1, y: 0, z: 0 },
        "LeftHandThumb3.rotation": { x: 0.5, y: 0, z: 0 },
        "LeftHandIndex1.rotation": { x: 0, y: 0.5, z: -0.08 },
        "LeftHandIndex2.rotation": { x: 0.15, y: 0.02, z: -0.06 },
        "LeftHandIndex3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandMiddle1.rotation": { x: 0, y: -0.1, z: -0.07 },
        "LeftHandMiddle2.rotation": { x: 0.18, y: 0.02, z: -0.07 },
        "LeftHandMiddle3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandRing1.rotation": { x: 0, y: -0.18, z: -0.1 },
        "LeftHandRing2.rotation": { x: 0.2, y: 0.02, z: -0.08 },
        "LeftHandRing3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandPinky1.rotation": { x: 0.06, y: -0.25, z: -0.12 },
        "LeftHandPinky2.rotation": { x: 0.15, y: 0.02, z: 0.0 },
        "LeftHandPinky3.rotation": { x: 0, y: 0, z: 0 },
      },
      index: {
        "LeftShoulder.rotation": { x: [1.5, 2, 1, 2], y: [0.2, 0.4, 1, 2], z: [-1.5, -1.3, 1, 2] },
        "LeftArm.rotation": { x: [1.5, 1.7, 1, 2], y: [-0.6, -0.4, 1, 2], z: [1, 1.2, 1, 2] },
        "LeftForeArm.rotation": { x: -0.815, y: [-0.4, 0, 1, 2], z: 1.575 },
        "LeftHand.rotation": { x: -0.276, y: -0.506, z: -0.208 },
        "LeftHandThumb1.rotation": { x: 0.579, y: 0.228, z: 0.363 },
        "LeftHandThumb2.rotation": { x: -0.027, y: -0.04, z: -0.662 },
        "LeftHandThumb3.rotation": { x: 0, y: 0.001, z: 0 },
        "LeftHandIndex1.rotation": { x: 0, y: -0.105, z: 0.225 },
        "LeftHandIndex2.rotation": { x: 0.256, y: -0.103, z: -0.213 },
        "LeftHandIndex3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandMiddle1.rotation": { x: 1.453, y: 0.07, z: 0.021 },
        "LeftHandMiddle2.rotation": { x: 1.599, y: 0.062, z: 0.07 },
        "LeftHandMiddle3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandRing1.rotation": { x: 1.528, y: -0.073, z: 0.052 },
        "LeftHandRing2.rotation": { x: 1.386, y: 0.044, z: 0.053 },
        "LeftHandRing3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandPinky1.rotation": { x: 1.65, y: -0.204, z: 0.031 },
        "LeftHandPinky2.rotation": { x: 1.302, y: 0.071, z: 0.085 },
        "LeftHandPinky3.rotation": { x: 0, y: 0, z: 0 },
      },
      ok: {
        "LeftShoulder.rotation": { x: [1.5, 2, 1, 2], y: [0.2, 0.4, 1, 2], z: [-1.5, -1.3, 1, 2] },
        "LeftArm.rotation": { x: [1.5, 1.7, 1, 1], y: [-0.6, -0.4, 1, 2], z: [1, 1.2, 1, 2] },
        "LeftForeArm.rotation": { x: -0.415, y: [-0.4, 0, 1, 2], z: 1.575 },
        "LeftHand.rotation": { x: -0.476, y: -0.506, z: -0.208 },
        "LeftHandThumb1.rotation": { x: 0.703, y: 0.445, z: 0.899 },
        "LeftHandThumb2.rotation": { x: -0.312, y: -0.04, z: -0.938 },
        "LeftHandThumb3.rotation": { x: -0.37, y: 0.024, z: -0.393 },
        "LeftHandIndex1.rotation": { x: 0.8, y: -0.086, z: -0.091 },
        "LeftHandIndex2.rotation": { x: 1.123, y: -0.046, z: -0.074 },
        "LeftHandIndex3.rotation": { x: 0.562, y: -0.013, z: -0.043 },
        "LeftHandMiddle1.rotation": { x: -0.019, y: -0.128, z: -0.082 },
        "LeftHandMiddle2.rotation": { x: 0.233, y: 0.019, z: -0.074 },
        "LeftHandMiddle3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandRing1.rotation": { x: 0.005, y: -0.241, z: -0.122 },
        "LeftHandRing2.rotation": { x: 0.261, y: 0.021, z: -0.076 },
        "LeftHandRing3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandPinky1.rotation": { x: 0.059, y: -0.336, z: -0.2 },
        "LeftHandPinky2.rotation": { x: 0.153, y: 0.019, z: 0.001 },
        "LeftHandPinky3.rotation": { x: 0, y: 0, z: 0 },
      },
      thumbup: {
        "LeftShoulder.rotation": { x: [1.5, 2, 1, 2], y: [0.2, 0.4, 1, 2], z: [-1.5, -1.3, 1, 2] },
        "LeftArm.rotation": { x: [1.5, 1.7, 1, 2], y: [-0.6, -0.4, 1, 2], z: [1, 1.2, 1, 2] },
        "LeftForeArm.rotation": { x: -0.415, y: 0.206, z: 1.575 },
        "LeftHand.rotation": { x: -0.276, y: -0.506, z: -0.208 },
        "LeftHandThumb1.rotation": { x: 0.208, y: -0.189, z: 0.685 },
        "LeftHandThumb2.rotation": { x: 0.129, y: -0.285, z: -0.163 },
        "LeftHandThumb3.rotation": { x: -0.047, y: 0.068, z: 0.401 },
        "LeftHandIndex1.rotation": { x: 1.412, y: -0.102, z: -0.152 },
        "LeftHandIndex2.rotation": { x: 1.903, y: -0.16, z: -0.114 },
        "LeftHandIndex3.rotation": { x: 0.535, y: -0.017, z: -0.062 },
        "LeftHandMiddle1.rotation": { x: 1.424, y: -0.103, z: -0.12 },
        "LeftHandMiddle2.rotation": { x: 1.919, y: -0.162, z: -0.114 },
        "LeftHandMiddle3.rotation": { x: 0.44, y: -0.012, z: -0.051 },
        "LeftHandRing1.rotation": { x: 1.619, y: -0.127, z: -0.053 },
        "LeftHandRing2.rotation": { x: 1.898, y: -0.16, z: -0.115 },
        "LeftHandRing3.rotation": { x: 0.262, y: -0.004, z: -0.031 },
        "LeftHandPinky1.rotation": { x: 1.661, y: -0.131, z: -0.016 },
        "LeftHandPinky2.rotation": { x: 1.715, y: -0.067, z: -0.13 },
        "LeftHandPinky3.rotation": { x: 0.627, y: -0.023, z: -0.071 },
      },
      thumbdown: {
        "LeftShoulder.rotation": { x: [1.5, 2, 1, 2], y: [0.2, 0.4, 1, 2], z: [-1.5, -1.3, 1, 2] },
        "LeftArm.rotation": { x: [1.5, 1.7, 1, 2], y: [-0.6, -0.4, 1, 2], z: [1, 1.2, 1, 2] },
        "LeftForeArm.rotation": { x: -2.015, y: 0.406, z: 1.575 },
        "LeftHand.rotation": { x: -0.176, y: -0.206, z: -0.208 },
        "LeftHandThumb1.rotation": { x: 0.208, y: -0.189, z: 0.685 },
        "LeftHandThumb2.rotation": { x: 0.129, y: -0.285, z: -0.163 },
        "LeftHandThumb3.rotation": { x: -0.047, y: 0.068, z: 0.401 },
        "LeftHandIndex1.rotation": { x: 1.412, y: -0.102, z: -0.152 },
        "LeftHandIndex2.rotation": { x: 1.903, y: -0.16, z: -0.114 },
        "LeftHandIndex3.rotation": { x: 0.535, y: -0.017, z: -0.062 },
        "LeftHandMiddle1.rotation": { x: 1.424, y: -0.103, z: -0.12 },
        "LeftHandMiddle2.rotation": { x: 1.919, y: -0.162, z: -0.114 },
        "LeftHandMiddle3.rotation": { x: 0.44, y: -0.012, z: -0.051 },
        "LeftHandRing1.rotation": { x: 1.619, y: -0.127, z: -0.053 },
        "LeftHandRing2.rotation": { x: 1.898, y: -0.16, z: -0.115 },
        "LeftHandRing3.rotation": { x: 0.262, y: -0.004, z: -0.031 },
        "LeftHandPinky1.rotation": { x: 1.661, y: -0.131, z: -0.016 },
        "LeftHandPinky2.rotation": { x: 1.715, y: -0.067, z: -0.13 },
        "LeftHandPinky3.rotation": { x: 0.627, y: -0.023, z: -0.071 },
      },
      side: {
        "LeftShoulder.rotation": { x: 1.755, y: -0.035, z: -1.63 },
        "LeftArm.rotation": { x: 1.263, y: -0.955, z: 1.024 },
        "LeftForeArm.rotation": { x: 0, y: 0, z: 0.8 },
        "LeftHand.rotation": { x: -0.36, y: -1.353, z: -0.184 },
        "LeftHandThumb1.rotation": { x: 0.137, y: -0.049, z: 0.863 },
        "LeftHandThumb2.rotation": { x: -0.293, y: 0.153, z: -0.193 },
        "LeftHandThumb3.rotation": { x: -0.271, y: -0.17, z: 0.18 },
        "LeftHandIndex1.rotation": { x: -0.018, y: 0.007, z: 0.28 },
        "LeftHandIndex2.rotation": { x: 0.247, y: -0.003, z: -0.025 },
        "LeftHandIndex3.rotation": { x: 0.13, y: -0.001, z: -0.013 },
        "LeftHandMiddle1.rotation": { x: 0.333, y: -0.015, z: 0.182 },
        "LeftHandMiddle2.rotation": { x: 0.313, y: -0.005, z: -0.032 },
        "LeftHandMiddle3.rotation": { x: 0.294, y: -0.004, z: -0.03 },
        "LeftHandRing1.rotation": { x: 0.456, y: -0.028, z: -0.092 },
        "LeftHandRing2.rotation": { x: 0.53, y: -0.014, z: -0.052 },
        "LeftHandRing3.rotation": { x: 0.478, y: -0.012, z: -0.047 },
        "LeftHandPinky1.rotation": { x: 0.647, y: -0.049, z: -0.184 },
        "LeftHandPinky2.rotation": { x: 0.29, y: -0.004, z: -0.029 },
        "LeftHandPinky3.rotation": { x: 0.501, y: -0.013, z: -0.049 },
      },
      shrug: {
        "Neck.rotation": { x: [-0.3, 0.3, 1, 2], y: [-0.3, 0.3, 1, 2], z: [-0.1, 0.1] },
        "Head.rotation": { x: [-0.3, 0.3], y: [-0.3, 0.3], z: [-0.1, 0.1] },
        "RightShoulder.rotation": { x: 1.732, y: -0.058, z: 1.407 },
        "RightArm.rotation": { x: 1.305, y: 0.46, z: 0.118 },
        "RightForeArm.rotation": { x: [0, 2.0], y: [-1, 0.2], z: -1.637 },
        "RightHand.rotation": { x: -0.048, y: 0.165, z: -0.39 },
        "RightHandThumb1.rotation": { x: 1.467, y: 0.599, z: -1.315 },
        "RightHandThumb2.rotation": { x: -0.255, y: -0.123, z: 0.119 },
        "RightHandThumb3.rotation": { x: 0, y: -0.002, z: 0 },
        "RightHandIndex1.rotation": { x: -0.293, y: -0.066, z: -0.112 },
        "RightHandIndex2.rotation": { x: 0.181, y: 0.007, z: 0.069 },
        "RightHandIndex3.rotation": { x: 0, y: 0, z: 0 },
        "RightHandMiddle1.rotation": { x: -0.063, y: -0.041, z: 0.032 },
        "RightHandMiddle2.rotation": { x: 0.149, y: 0.005, z: 0.05 },
        "RightHandMiddle3.rotation": { x: 0, y: 0, z: 0 },
        "RightHandRing1.rotation": { x: 0.152, y: -0.03, z: 0.132 },
        "RightHandRing2.rotation": { x: 0.194, y: 0.007, z: 0.058 },
        "RightHandRing3.rotation": { x: 0, y: 0, z: 0 },
        "RightHandPinky1.rotation": { x: 0.306, y: -0.015, z: 0.257 },
        "RightHandPinky2.rotation": { x: 0.15, y: -0.003, z: -0.003 },
        "RightHandPinky3.rotation": { x: 0, y: 0, z: 0 },
        "LeftShoulder.rotation": { x: 1.713, y: 0.141, z: -1.433 },
        "LeftArm.rotation": { x: 1.136, y: -0.422, z: -0.416 },
        "LeftForeArm.rotation": { x: 1.42, y: 0.123, z: 1.506 },
        "LeftHand.rotation": { x: 0.073, y: -0.138, z: 0.064 },
        "LeftHandThumb1.rotation": { x: 1.467, y: -0.599, z: 1.314 },
        "LeftHandThumb2.rotation": { x: -0.255, y: 0.123, z: -0.119 },
        "LeftHandThumb3.rotation": { x: 0, y: 0.001, z: 0 },
        "LeftHandIndex1.rotation": { x: -0.293, y: 0.066, z: 0.112 },
        "LeftHandIndex2.rotation": { x: 0.181, y: -0.007, z: -0.069 },
        "LeftHandIndex3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandMiddle1.rotation": { x: -0.062, y: 0.041, z: -0.032 },
        "LeftHandMiddle2.rotation": { x: 0.149, y: -0.005, z: -0.05 },
        "LeftHandMiddle3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandRing1.rotation": { x: 0.152, y: 0.03, z: -0.132 },
        "LeftHandRing2.rotation": { x: 0.194, y: -0.007, z: -0.058 },
        "LeftHandRing3.rotation": { x: 0, y: 0, z: 0 },
        "LeftHandPinky1.rotation": { x: 0.306, y: 0.015, z: -0.257 },
        "LeftHandPinky2.rotation": { x: 0.15, y: 0.003, z: 0.003 },
        "LeftHandPinky3.rotation": { x: 0, y: 0, z: 0 },
      },
      namaste: {
        "RightShoulder.rotation": { x: 1.758, y: 0.099, z: 1.604 },
        "RightArm.rotation": { x: 0.862, y: -0.292, z: -0.932 },
        "RightForeArm.rotation": { x: 0.083, y: 0.066, z: -1.791 },
        "RightHand.rotation": { x: -0.52, y: -0.001, z: -0.176 },
        "RightHandThumb1.rotation": { x: 0.227, y: 0.418, z: -0.776 },
        "RightHandThumb2.rotation": { x: -0.011, y: -0.003, z: 0.171 },
        "RightHandThumb3.rotation": { x: -0.041, y: -0.001, z: -0.013 },
        "RightHandIndex1.rotation": { x: -0.236, y: 0.003, z: -0.028 },
        "RightHandIndex2.rotation": { x: 0.004, y: 0, z: 0.001 },
        "RightHandIndex3.rotation": { x: 0.002, y: 0, z: 0 },
        "RightHandMiddle1.rotation": { x: -0.236, y: 0.003, z: -0.028 },
        "RightHandMiddle2.rotation": { x: 0.004, y: 0, z: 0.001 },
        "RightHandMiddle3.rotation": { x: 0.002, y: 0, z: 0 },
        "RightHandRing1.rotation": { x: -0.236, y: 0.003, z: -0.028 },
        "RightHandRing2.rotation": { x: 0.004, y: 0, z: 0.001 },
        "RightHandRing3.rotation": { x: 0.002, y: 0, z: 0 },
        "RightHandPinky1.rotation": { x: -0.236, y: 0.003, z: -0.028 },
        "RightHandPinky2.rotation": { x: 0.004, y: 0, z: 0.001 },
        "RightHandPinky3.rotation": { x: 0.002, y: 0, z: 0 },
        "LeftShoulder.rotation": { x: 1.711, y: -0.002, z: -1.625 },
        "LeftArm.rotation": { x: 0.683, y: 0.334, z: 0.977 },
        "LeftForeArm.rotation": { x: 0.086, y: -0.066, z: 1.843 },
        "LeftHand.rotation": { x: -0.595, y: -0.229, z: 0.096 },
        "LeftHandThumb1.rotation": { x: 0.404, y: -0.05, z: 0.537 },
        "LeftHandThumb2.rotation": { x: -0.02, y: 0.004, z: -0.154 },
        "LeftHandThumb3.rotation": { x: -0.049, y: 0.002, z: -0.019 },
        "LeftHandIndex1.rotation": { x: -0.113, y: -0.001, z: 0.014 },
        "LeftHandIndex2.rotation": { x: 0.003, y: 0, z: 0 },
        "LeftHandIndex3.rotation": { x: 0.002, y: 0, z: 0 },
        "LeftHandMiddle1.rotation": { x: -0.113, y: -0.001, z: 0.014 },
        "LeftHandMiddle2.rotation": { x: 0.004, y: 0, z: 0 },
        "LeftHandMiddle3.rotation": { x: 0.002, y: 0, z: 0 },
        "LeftHandRing1.rotation": { x: -0.113, y: -0.001, z: 0.014 },
        "LeftHandRing2.rotation": { x: 0.003, y: 0, z: 0 },
        "LeftHandRing3.rotation": { x: 0.002, y: 0, z: 0 },
        "LeftHandPinky1.rotation": { x: -0.122, y: -0.001, z: -0.057 },
        "LeftHandPinky2.rotation": { x: 0.012, y: 0.001, z: 0.07 },
        "LeftHandPinky3.rotation": { x: 0.002, y: 0, z: 0 },
      },
    };

    // Pose deltas
    // NOTE: In this object (x,y,z) are always Euler rotations despite the name!!
    // NOTE: This object should include all the used delta properties.
    this.poseDelta = {
      props: {
        "Hips.quaternion": { x: 0, y: 0, z: 0 },
        "Spine.quaternion": { x: 0, y: 0, z: 0 },
        "Spine1.quaternion": { x: 0, y: 0, z: 0 },
        "Neck.quaternion": { x: 0, y: 0, z: 0 },
        "Head.quaternion": { x: 0, y: 0, z: 0 },
        "Spine1.scale": { x: 0, y: 0, z: 0 },
        "Neck.scale": { x: 0, y: 0, z: 0 },
        "LeftArm.scale": { x: 0, y: 0, z: 0 },
        "RightArm.scale": { x: 0, y: 0, z: 0 },
      },
    };
    // Add legs, arms and hands
    ["Left", "Right"].forEach(x => {
      ["Leg", "UpLeg", "Arm", "ForeArm", "Hand"].forEach(y => {
        this.poseDelta.props[x + y + ".quaternion"] = { x: 0, y: 0, z: 0 };
      });
      ["HandThumb", "HandIndex", "HandMiddle", "HandRing", "HandPinky"].forEach(y => {
        this.poseDelta.props[x + y + "1.quaternion"] = { x: 0, y: 0, z: 0 };
        this.poseDelta.props[x + y + "2.quaternion"] = { x: 0, y: 0, z: 0 };
        this.poseDelta.props[x + y + "3.quaternion"] = { x: 0, y: 0, z: 0 };
      });
    });

    // Dynamically pick up all the property names that we need in the code
    const names = new Set();
    Object.values(this.poseTemplates).forEach(x => {
      Object.keys(this.propsToThreeObjects(x.props)).forEach(y => names.add(y));
    });
    Object.keys(this.poseDelta.props).forEach(x => {
      names.add(x);
    });
    this.posePropNames = [...names];

    // Use "side" as the first pose, weight on left leg
    this.poseName = "side"; // First pose
    this.poseWeightOnLeft = true; // Initial weight on left leg
    this.gesture = null; // Values that override pose properties
    this.poseCurrentTemplate = this.poseTemplates[this.poseName];
    this.poseBase = this.poseFactory(this.poseCurrentTemplate);
    this.poseTarget = this.poseFactory(this.poseCurrentTemplate);
    this.poseStraight = this.propsToThreeObjects(this.poseTemplates["straight"].props); // Straight pose used as a reference
    this.poseAvatar = null; // Set when avatar has been loaded
    this.avatarHeight = 1.7;

    this.animTemplateEyes = {
      name: "eyes",
      idle: {
        alt: [
          {
            p: () => (this.avatar?.hasOwnProperty("avatarIdleEyeContact") ? this.avatar.avatarIdleEyeContact : this.opt.avatarIdleEyeContact),
            delay: [200, 5000],
            dt: [200, [2000, 5000], [3000, 10000, 1, 2]],
            vs: {
              headMove: [this.avatar?.hasOwnProperty("avatarIdleHeadMove") ? this.avatar.avatarIdleHeadMove : this.opt.avatarIdleHeadMove],
              eyesRotateY: [[-0.6, 0.6]],
              eyesRotateX: [[-0.2, 0.6]],
              eyeContact: [null, 1],
            },
          },
          {
            delay: [200, 5000],
            dt: [200, [2000, 5000, 1, 2]],
            vs: {
              headMove: [this.avatar?.hasOwnProperty("avatarIdleHeadMove") ? this.avatar.avatarIdleHeadMove : this.opt.avatarIdleHeadMove],
              eyesRotateY: [[-0.6, 0.6]],
              eyesRotateX: [[-0.2, 0.6]],
            },
          },
        ],
      },
      speaking: {
        alt: [
          {
            p: () => (this.avatar?.hasOwnProperty("avatarSpeakingEyeContact") ? this.avatar.avatarSpeakingEyeContact : this.opt.avatarSpeakingEyeContact),
            delay: [200, 5000],
            dt: [0, [3000, 10000, 1, 2], [2000, 5000]],
            vs: {
              eyeContact: [1, null],
              headMove: [null, this.avatar?.hasOwnProperty("avatarSpeakingHeadMove") ? this.avatar.avatarSpeakingHeadMove : this.opt.avatarSpeakingHeadMove, null],
              eyesRotateY: [null, [-0.6, 0.6]],
              eyesRotateX: [null, [-0.2, 0.6]],
            },
          },
          {
            delay: [200, 5000],
            dt: [200, [2000, 5000, 1, 2]],
            vs: {
              headMove: [this.avatar?.hasOwnProperty("avatarSpeakingHeadMove") ? this.avatar.avatarSpeakingHeadMove : this.opt.avatarSpeakingHeadMove, null],
              eyesRotateY: [[-0.6, 0.6]],
              eyesRotateX: [[-0.2, 0.6]],
            },
          },
        ],
      },
    };
    this.animTemplateBlink = {
      name: "blink",
      alt: [
        { p: 0.85, delay: [1000, 8000, 1, 2], dt: [50, [100, 300], 100], vs: { eyeBlinkLeft: [1, 1, 0], eyeBlinkRight: [1, 1, 0] } },
        { delay: [1000, 4000, 1, 2], dt: [50, [100, 200], 100, [10, 400, 0], 50, [100, 200], 100], vs: { eyeBlinkLeft: [1, 1, 0, 0, 1, 1, 0], eyeBlinkRight: [1, 1, 0, 0, 1, 1, 0] } },
      ],
    };

    this.animMoods = {
      neutral: {
        baseline: { eyesLookDown: 0.1 },
        speech: { deltaRate: 0, deltaPitch: 0, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 1500, dt: [1200, 500, 1000], vs: { chestInhale: [0.5, 0.5, 0] } },
          {
            name: "pose",
            alt: [
              { p: 0.5, delay: [5000, 30000], vs: { pose: ["side"] } },
              { p: 0.3, delay: [5000, 30000], vs: { pose: ["hip"] }, M: { delay: [5000, 30000], vs: { pose: ["wide"] } } },
              { delay: [5000, 30000], vs: { pose: ["straight"] } },
            ],
          },
          {
            name: "head",
            idle: { delay: [0, 1000], dt: [[200, 5000]], vs: { bodyRotateX: [[-0.1, -0.2]], bodyRotateY: [[0, 0]], bodyRotateZ: [[-0.08, 0.08]] } },
            speaking: { dt: [[0, 1000, 0]], vs: { bodyRotateX: [[0, 0]], bodyRotateY: [[0, 0]], bodyRotateZ: [[0, 0]] } },
          },
          this.animTemplateEyes,
          this.animTemplateBlink,
          {
            name: "mouth",
            delay: [1000, 5000],
            dt: [
              [100, 500],
              [100, 5000, 2],
            ],
            vs: { mouthRollLower: [[0, 0.3, 2]], mouthRollUpper: [[0, 0.3, 2]], mouthStretchLeft: [[0, 0.3]], mouthStretchRight: [[0, 0.3]], mouthPucker: [[0, 0.3]] },
          },
          {
            name: "misc",
            delay: [100, 5000],
            dt: [
              [100, 500],
              [1000, 5000, 2],
            ],
            vs: { eyeSquintLeft: [[0, 0.3, 2]], eyeSquintRight: [[0, 0.3, 2]], browInnerUp: [[0, 0.3, 2]], browOuterUpLeft: [[0, 0.3, 2]], browOuterUpRight: [[0, 0.3, 2]] },
          },
        ],
      },
      happy: {
        baseline: { mouthSmile: 0.2, eyesLookDown: 0.1 },
        speech: { deltaRate: 0, deltaPitch: 0.1, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 1500, dt: [1200, 500, 1000], vs: { chestInhale: [0.5, 0.5, 0] } },
          {
            name: "pose",
            idle: {
              alt: [
                { p: 0.6, delay: [5000, 30000], vs: { pose: ["side"] } },
                { p: 0.2, delay: [5000, 30000], vs: { pose: ["hip"] }, M: { delay: [5000, 30000], vs: { pose: ["side"] } } },
                { p: 0.1, delay: [5000, 30000], vs: { pose: ["straight"] } },
                { delay: [5000, 10000], vs: { pose: ["wide"] } },
                { delay: [1000, 3000], vs: { pose: ["turn"] } },
              ],
            },
            speaking: {
              alt: [
                { p: 0.4, delay: [5000, 30000], vs: { pose: ["side"] } },
                { p: 0.4, delay: [5000, 30000], vs: { pose: ["straight"] } },
                { delay: [5000, 20000], vs: { pose: ["hip"] }, M: { delay: [5000, 30000], vs: { pose: ["wide"] } } },
              ],
            },
          },
          {
            name: "head",
            idle: { dt: [[1000, 5000]], vs: { bodyRotateX: [[-0.04, 0.1]], bodyRotateY: [[-0.3, 0.3]], bodyRotateZ: [[-0.08, 0.08]] } },
            speaking: { dt: [[0, 1000, 0]], vs: { bodyRotateX: [[-0.05, 0.15, 1, 2]], bodyRotateY: [[-0.1, 0.1]], bodyRotateZ: [[-0.1, 0.1]] } },
          },
          this.animTemplateEyes,
          this.animTemplateBlink,
          {
            name: "mouth",
            delay: [1000, 5000],
            dt: [
              [100, 500],
              [100, 5000, 2],
            ],
            vs: {
              mouthLeft: [[0, 0.3, 2]],
              mouthSmile: [[0, 0.2, 3]],
              mouthRollLower: [[0, 0.3, 2]],
              mouthRollUpper: [[0, 0.3, 2]],
              mouthStretchLeft: [[0, 0.3]],
              mouthStretchRight: [[0, 0.3]],
              mouthPucker: [[0, 0.3]],
            },
          },
          {
            name: "misc",
            delay: [100, 5000],
            dt: [
              [100, 500],
              [1000, 5000, 2],
            ],
            vs: { eyeSquintLeft: [[0, 0.3, 2]], eyeSquintRight: [[0, 0.3, 2]], browInnerUp: [[0, 0.3, 2]], browOuterUpLeft: [[0, 0.3, 2]], browOuterUpRight: [[0, 0.3, 2]] },
          },
        ],
      },
      angry: {
        baseline: {
          eyesLookDown: 0.1,
          browDownLeft: 0.6,
          browDownRight: 0.6,
          jawForward: 0.3,
          mouthFrownLeft: 0.7,
          mouthFrownRight: 0.7,
          mouthRollLower: 0.2,
          mouthShrugLower: 0.3,
          handFistLeft: 1,
          handFistRight: 1,
        },
        speech: { deltaRate: -0.2, deltaPitch: 0.2, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 500, dt: [1000, 500, 1000], vs: { chestInhale: [0.7, 0.7, 0] } },
          {
            name: "pose",
            alt: [
              { p: 0.4, delay: [5000, 30000], vs: { pose: ["side"] } },
              { p: 0.4, delay: [5000, 30000], vs: { pose: ["straight"] } },
              { p: 0.2, delay: [5000, 30000], vs: { pose: ["hip"] }, M: { delay: [5000, 30000], vs: { pose: ["wide"] } } },
            ],
          },
          {
            name: "head",
            idle: { delay: [100, 500], dt: [[200, 5000]], vs: { bodyRotateX: [[-0.04, 0.1]], bodyRotateY: [[-0.2, 0.2]], bodyRotateZ: [[-0.08, 0.08]] } },
            speaking: { dt: [[0, 1000, 0]], vs: { bodyRotateX: [[-0.05, 0.15, 1, 2]], bodyRotateY: [[-0.1, 0.1]], bodyRotateZ: [[-0.1, 0.1]] } },
          },
          this.animTemplateEyes,
          this.animTemplateBlink,
          {
            name: "mouth",
            delay: [1000, 5000],
            dt: [
              [100, 500],
              [100, 5000, 2],
            ],
            vs: { mouthRollLower: [[0, 0.3, 2]], mouthRollUpper: [[0, 0.3, 2]], mouthStretchLeft: [[0, 0.3]], mouthStretchRight: [[0, 0.3]], mouthPucker: [[0, 0.3]] },
          },
          {
            name: "misc",
            delay: [100, 5000],
            dt: [
              [100, 500],
              [1000, 5000, 2],
            ],
            vs: { eyeSquintLeft: [[0, 0.3, 2]], eyeSquintRight: [[0, 0.3, 2]], browInnerUp: [[0, 0.3, 2]], browOuterUpLeft: [[0, 0.3, 2]], browOuterUpRight: [[0, 0.3, 2]] },
          },
        ],
      },
      sad: {
        baseline: {
          eyesLookDown: 0.2,
          browDownRight: 0.1,
          browInnerUp: 0.6,
          browOuterUpRight: 0.2,
          eyeSquintLeft: 0.7,
          eyeSquintRight: 0.7,
          mouthFrownLeft: 0.8,
          mouthFrownRight: 0.8,
          mouthLeft: 0.2,
          mouthPucker: 0.5,
          mouthRollLower: 0.2,
          mouthRollUpper: 0.2,
          mouthShrugLower: 0.2,
          mouthShrugUpper: 0.2,
          mouthStretchLeft: 0.4,
        },
        speech: { deltaRate: -0.2, deltaPitch: -0.2, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 1500, dt: [1000, 500, 1000], vs: { chestInhale: [0.3, 0.3, 0] } },
          {
            name: "pose",
            alt: [
              { p: 0.4, delay: [5000, 30000], vs: { pose: ["side"] } },
              { p: 0.4, delay: [5000, 30000], vs: { pose: ["straight"] } },
              { delay: [5000, 20000], vs: { pose: ["side"] }, full: { delay: [5000, 20000], vs: { pose: ["oneknee"] } } },
            ],
          },
          {
            name: "head",
            idle: { delay: [100, 500], dt: [[200, 5000]], vs: { bodyRotateX: [[-0.04, 0.1]], bodyRotateY: [[-0.2, 0.2]], bodyRotateZ: [[-0.08, 0.08]] } },
            speaking: { dt: [[0, 1000, 0]], vs: { bodyRotateX: [[-0.05, 0.15, 1, 2]], bodyRotateY: [[-0.1, 0.1]], bodyRotateZ: [[-0.1, 0.1]] } },
          },
          this.animTemplateEyes,
          this.animTemplateBlink,
          {
            name: "mouth",
            delay: [1000, 5000],
            dt: [
              [100, 500],
              [100, 5000, 2],
            ],
            vs: { mouthRollLower: [[0, 0.3, 2]], mouthRollUpper: [[0, 0.3, 2]], mouthStretchLeft: [[0, 0.3]], mouthStretchRight: [[0, 0.3]], mouthPucker: [[0, 0.3]] },
          },
          {
            name: "misc",
            delay: [100, 5000],
            dt: [
              [100, 500],
              [1000, 5000, 2],
            ],
            vs: { eyeSquintLeft: [[0, 0.3, 2]], eyeSquintRight: [[0, 0.3, 2]], browInnerUp: [[0, 0.3, 2]], browOuterUpLeft: [[0, 0.3, 2]], browOuterUpRight: [[0, 0.3, 2]] },
          },
        ],
      },
      fear: {
        baseline: { browInnerUp: 0.7, eyeSquintLeft: 0.5, eyeSquintRight: 0.5, eyeWideLeft: 0.6, eyeWideRight: 0.6, mouthClose: 0.1, mouthFunnel: 0.3, mouthShrugLower: 0.5, mouthShrugUpper: 0.5 },
        speech: { deltaRate: -0.2, deltaPitch: 0, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 500, dt: [1000, 500, 1000], vs: { chestInhale: [0.7, 0.7, 0] } },
          {
            name: "pose",
            alt: [
              { p: 0.8, delay: [5000, 30000], vs: { pose: ["side"] } },
              { delay: [5000, 30000], vs: { pose: ["straight"] } },
              { delay: [5000, 20000], vs: { pose: ["wide"] } },
              { delay: [5000, 20000], vs: { pose: ["side"] }, full: { delay: [5000, 20000], vs: { pose: ["oneknee"] } } },
            ],
          },
          {
            name: "head",
            idle: { delay: [100, 500], dt: [[200, 3000]], vs: { bodyRotateX: [[-0.06, 0.12]], bodyRotateY: [[-0.7, 0.7]], bodyRotateZ: [[-0.1, 0.1]] } },
            speaking: { dt: [[0, 1000, 0]], vs: { bodyRotateX: [[-0.05, 0.15, 1, 2]], bodyRotateY: [[-0.1, 0.1]], bodyRotateZ: [[-0.1, 0.1]] } },
          },
          this.animTemplateEyes,
          this.animTemplateBlink,
          {
            name: "mouth",
            delay: [1000, 5000],
            dt: [
              [100, 500],
              [100, 5000, 2],
            ],
            vs: { mouthRollLower: [[0, 0.3, 2]], mouthRollUpper: [[0, 0.3, 2]], mouthStretchLeft: [[0, 0.3]], mouthStretchRight: [[0, 0.3]], mouthPucker: [[0, 0.3]] },
          },
          {
            name: "misc",
            delay: [100, 5000],
            dt: [
              [100, 500],
              [1000, 5000, 2],
            ],
            vs: { eyeSquintLeft: [[0, 0.3, 2]], eyeSquintRight: [[0, 0.3, 2]], browInnerUp: [[0, 0.3, 2]], browOuterUpLeft: [[0, 0.3, 2]], browOuterUpRight: [[0, 0.3, 2]] },
          },
        ],
      },
      disgust: {
        baseline: {
          browDownLeft: 0.7,
          browDownRight: 0.1,
          browInnerUp: 0.3,
          eyeSquintLeft: 1,
          eyeSquintRight: 1,
          eyeWideLeft: 0.5,
          eyeWideRight: 0.5,
          eyesRotateX: 0.05,
          mouthLeft: 0.4,
          mouthPressLeft: 0.3,
          mouthRollLower: 0.3,
          mouthShrugLower: 0.3,
          mouthShrugUpper: 0.8,
          mouthUpperUpLeft: 0.3,
          noseSneerLeft: 1,
          noseSneerRight: 0.7,
        },
        speech: { deltaRate: -0.2, deltaPitch: 0, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 1500, dt: [1000, 500, 1000], vs: { chestInhale: [0.5, 0.5, 0] } },
          { name: "pose", alt: [{ delay: [5000, 20000], vs: { pose: ["side"] } }] },
          {
            name: "head",
            idle: { delay: [100, 500], dt: [[200, 5000]], vs: { bodyRotateX: [[-0.04, 0.1]], bodyRotateY: [[-0.2, 0.2]], bodyRotateZ: [[-0.08, 0.08]] } },
            speaking: { dt: [[0, 1000, 0]], vs: { bodyRotateX: [[-0.05, 0.15, 1, 2]], bodyRotateY: [[-0.1, 0.1]], bodyRotateZ: [[-0.1, 0.1]] } },
          },
          this.animTemplateEyes,
          this.animTemplateBlink,
          {
            name: "mouth",
            delay: [1000, 5000],
            dt: [
              [100, 500],
              [100, 5000, 2],
            ],
            vs: { mouthRollLower: [[0, 0.3, 2]], mouthRollUpper: [[0, 0.3, 2]], mouthStretchLeft: [[0, 0.3]], mouthStretchRight: [[0, 0.3]], mouthPucker: [[0, 0.3]] },
          },
          {
            name: "misc",
            delay: [100, 5000],
            dt: [
              [100, 500],
              [1000, 5000, 2],
            ],
            vs: { eyeSquintLeft: [[0, 0.3, 2]], eyeSquintRight: [[0, 0.3, 2]], browInnerUp: [[0, 0.3, 2]], browOuterUpLeft: [[0, 0.3, 2]], browOuterUpRight: [[0, 0.3, 2]] },
          },
        ],
      },
      love: {
        baseline: {
          browInnerUp: 0.4,
          browOuterUpLeft: 0.2,
          browOuterUpRight: 0.2,
          mouthSmile: 0.2,
          eyeBlinkLeft: 0.6,
          eyeBlinkRight: 0.6,
          eyeWideLeft: 0.7,
          eyeWideRight: 0.7,
          bodyRotateX: 0.1,
          mouthDimpleLeft: 0.1,
          mouthDimpleRight: 0.1,
          mouthPressLeft: 0.2,
          mouthShrugUpper: 0.2,
          mouthUpperUpLeft: 0.1,
          mouthUpperUpRight: 0.1,
        },
        speech: { deltaRate: -0.1, deltaPitch: -0.7, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 1500, dt: [1500, 500, 1500], vs: { chestInhale: [0.8, 0.8, 0] } },
          {
            name: "pose",
            alt: [
              { p: 0.4, delay: [5000, 30000], vs: { pose: ["side"] } },
              { p: 0.2, delay: [5000, 30000], vs: { pose: ["straight"] } },
              { p: 0.2, delay: [5000, 30000], vs: { pose: ["hip"] }, M: { delay: [5000, 30000], vs: { pose: ["side"] } } },
              { delay: [5000, 10000], vs: { pose: ["side"] }, full: { delay: [5000, 10000], vs: { pose: ["kneel"] } } },
              { delay: [1000, 3000], vs: { pose: ["turn"] }, M: { delay: [1000, 3000], vs: { pose: ["wide"] } } },
              { delay: [1000, 3000], vs: { pose: ["back"] }, M: { delay: [1000, 3000], vs: { pose: ["wide"] } } },
              { delay: [5000, 20000], vs: { pose: ["side"] }, M: { delay: [5000, 20000], vs: { pose: ["side"] } }, full: { delay: [5000, 20000], vs: { pose: ["bend"] } } },
              { delay: [1000, 3000], vs: { pose: ["side"] }, full: { delay: [5000, 10000], vs: { pose: ["oneknee"] } } },
            ],
          },
          {
            name: "head",
            idle: { dt: [[1000, 5000]], vs: { bodyRotateX: [[-0.04, 0.1]], bodyRotateY: [[-0.3, 0.3]], bodyRotateZ: [[-0.08, 0.08]] } },
            speaking: { dt: [[0, 1000, 0]], vs: { bodyRotateX: [[-0.05, 0.15, 1, 2]], bodyRotateY: [[-0.1, 0.1]], bodyRotateZ: [[-0.1, 0.1]] } },
          },
          this.animTemplateEyes,
          this.deepCopy(this.animTemplateBlink, o => {
            o.alt[0].delay[0] = o.alt[1].delay[0] = 2000;
          }),
          {
            name: "mouth",
            delay: [1000, 5000],
            dt: [
              [100, 500],
              [100, 5000, 2],
            ],
            vs: { mouthLeft: [[0, 0.3, 2]], mouthRollLower: [[0, 0.3, 2]], mouthRollUpper: [[0, 0.3, 2]], mouthStretchLeft: [[0, 0.3]], mouthStretchRight: [[0, 0.3]], mouthPucker: [[0, 0.3]] },
          },
          {
            name: "misc",
            delay: [100, 5000],
            dt: [
              [500, 1000],
              [1000, 5000, 2],
            ],
            vs: { eyeSquintLeft: [[0, 0.3, 2]], eyeSquintRight: [[0, 0.3, 2]], browInnerUp: [[0.3, 0.6, 2]], browOuterUpLeft: [[0.1, 0.3, 2]], browOuterUpRight: [[0.1, 0.3, 2]] },
          },
        ],
      },
      sleep: {
        baseline: { eyeBlinkLeft: 1, eyeBlinkRight: 1, eyesClosed: 0.6 },
        speech: { deltaRate: 0, deltaPitch: -0.2, deltaVolume: 0 },
        anims: [
          { name: "breathing", delay: 1500, dt: [1000, 500, 1000], vs: { chestInhale: [0.6, 0.6, 0] } },
          { name: "pose", alt: [{ delay: [5000, 20000], vs: { pose: ["side"] } }] },
          { name: "head", delay: [1000, 5000], dt: [[2000, 10000]], vs: { bodyRotateX: [[0, 0.4]], bodyRotateY: [[-0.1, 0.1]], bodyRotateZ: [[-0.04, 0.04]] } },
          { name: "eyes", delay: 10010, dt: [], vs: {} },
          { name: "blink", delay: 10020, dt: [], vs: {} },
          { name: "mouth", delay: 10030, dt: [], vs: {} },
          { name: "misc", delay: 10040, dt: [], vs: {} },
        ],
      },
    };
    this.moodName = this.opt.avatarMood || "neutral";
    this.mood = this.animMoods[this.moodName];
    if (!this.mood) {
      this.moodName = "neutral";
      this.mood = this.animMoods["neutral"];
    }

    // Animation templates for emojis
    this.animEmojis = {
      "😐": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          pose: ["straight"],
          browInnerUp: [0.4],
          eyeWideLeft: [0.7],
          eyeWideRight: [0.7],
          mouthPressLeft: [0.6],
          mouthPressRight: [0.6],
          mouthRollLower: [0.3],
          mouthStretchLeft: [1],
          mouthStretchRight: [1],
        },
      },
      "😶": { link: "😐" },
      "😏": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          eyeContact: [0],
          browDownRight: [0.1],
          browInnerUp: [0.7],
          browOuterUpRight: [0.2],
          eyeLookInRight: [0.7],
          eyeLookOutLeft: [0.7],
          eyeSquintLeft: [1],
          eyeSquintRight: [0.8],
          eyesRotateY: [0.7],
          mouthLeft: [0.4],
          mouthPucker: [0.4],
          mouthShrugLower: [0.3],
          mouthShrugUpper: [0.2],
          mouthSmile: [0.2],
          mouthSmileLeft: [0.4],
          mouthSmileRight: [0.2],
          mouthStretchLeft: [0.5],
          mouthUpperUpLeft: [0.6],
          noseSneerLeft: [0.7],
        },
      },
      "🙂": { dt: [300, 2000], rescale: [0, 1], vs: { mouthSmile: [0.5] } },
      "🙃": { link: "🙂" },
      "😊": { dt: [300, 2000], rescale: [0, 1], vs: { browInnerUp: [0.6], eyeSquintLeft: [1], eyeSquintRight: [1], mouthSmile: [0.7], noseSneerLeft: [0.7], noseSneerRight: [0.7] } },
      "😇": { link: "😊" },
      "😀": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.6],
          jawOpen: [0.1],
          mouthDimpleLeft: [0.2],
          mouthDimpleRight: [0.2],
          mouthOpen: [0.3],
          mouthPressLeft: [0.3],
          mouthPressRight: [0.3],
          mouthRollLower: [0.4],
          mouthShrugUpper: [0.4],
          mouthSmile: [0.7],
          mouthUpperUpLeft: [0.3],
          mouthUpperUpRight: [0.3],
          noseSneerLeft: [0.4],
          noseSneerRight: [0.4],
        },
      },
      "😃": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.6],
          eyeWideLeft: [0.7],
          eyeWideRight: [0.7],
          jawOpen: [0.1],
          mouthDimpleLeft: [0.2],
          mouthDimpleRight: [0.2],
          mouthOpen: [0.3],
          mouthPressLeft: [0.3],
          mouthPressRight: [0.3],
          mouthRollLower: [0.4],
          mouthShrugUpper: [0.4],
          mouthSmile: [0.7],
          mouthUpperUpLeft: [0.3],
          mouthUpperUpRight: [0.3],
          noseSneerLeft: [0.4],
          noseSneerRight: [0.4],
        },
      },
      "😄": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.3],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          jawOpen: [0.2],
          mouthDimpleLeft: [0.2],
          mouthDimpleRight: [0.2],
          mouthOpen: [0.3],
          mouthPressLeft: [0.3],
          mouthPressRight: [0.3],
          mouthRollLower: [0.4],
          mouthShrugUpper: [0.4],
          mouthSmile: [0.7],
          mouthUpperUpLeft: [0.3],
          mouthUpperUpRight: [0.3],
          noseSneerLeft: [0.4],
          noseSneerRight: [0.4],
        },
      },
      "😁": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.3],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          jawOpen: [0.3],
          mouthDimpleLeft: [0.2],
          mouthDimpleRight: [0.2],
          mouthPressLeft: [0.5],
          mouthPressRight: [0.5],
          mouthShrugUpper: [0.4],
          mouthSmile: [0.7],
          mouthUpperUpLeft: [0.3],
          mouthUpperUpRight: [0.3],
          noseSneerLeft: [0.4],
          noseSneerRight: [0.4],
        },
      },
      "😆": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.3],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          eyesClosed: [0.6],
          jawOpen: [0.3],
          mouthDimpleLeft: [0.2],
          mouthDimpleRight: [0.2],
          mouthPressLeft: [0.5],
          mouthPressRight: [0.5],
          mouthShrugUpper: [0.4],
          mouthSmile: [0.7],
          mouthUpperUpLeft: [0.3],
          mouthUpperUpRight: [0.3],
          noseSneerLeft: [0.4],
          noseSneerRight: [0.4],
        },
      },
      "😂": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.3],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          eyesClosed: [0.6],
          jawOpen: [0.3],
          mouthDimpleLeft: [0.2],
          mouthDimpleRight: [0.2],
          mouthPressLeft: [0.5],
          mouthPressRight: [0.5],
          mouthShrugUpper: [0.4],
          mouthSmile: [0.7],
          mouthUpperUpLeft: [0.3],
          mouthUpperUpRight: [0.3],
          noseSneerLeft: [0.4],
          noseSneerRight: [0.4],
        },
      },
      "🤣": { link: "😂" },
      "😅": { link: "😂" },
      "😉": {
        dt: [500, 200, 500, 500],
        rescale: [0, 0, 0, 1],
        vs: {
          mouthSmile: [0.5],
          mouthOpen: [0.2],
          mouthSmileLeft: [0, 0.5, 0],
          eyeBlinkLeft: [0, 0.7, 0],
          eyeBlinkRight: [0, 0, 0],
          bodyRotateX: [0.05, 0.05, 0.05, 0],
          bodyRotateZ: [-0.05, -0.05, -0.05, 0],
          browDownLeft: [0, 0.7, 0],
          cheekSquintLeft: [0, 0.7, 0],
          eyeSquintLeft: [0, 1, 0],
          eyesClosed: [0],
        },
      },

      "😭": {
        dt: [1000, 1000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [1],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          eyesClosed: [0.1],
          jawOpen: [0],
          mouthFrownLeft: [1],
          mouthFrownRight: [1],
          mouthOpen: [0.5],
          mouthPucker: [0.5],
          mouthUpperUpLeft: [0.6],
          mouthUpperUpRight: [0.6],
        },
      },
      "🥺": {
        dt: [1000, 1000],
        rescale: [0, 1],
        vs: {
          browDownLeft: [0.2],
          browDownRight: [0.2],
          browInnerUp: [1],
          eyeWideLeft: [0.9],
          eyeWideRight: [0.9],
          eyesClosed: [0.1],
          mouthClose: [0.2],
          mouthFrownLeft: [1],
          mouthFrownRight: [1],
          mouthPressLeft: [0.4],
          mouthPressRight: [0.4],
          mouthPucker: [1],
          mouthRollLower: [0.6],
          mouthRollUpper: [0.2],
          mouthUpperUpLeft: [0.8],
          mouthUpperUpRight: [0.8],
        },
      },
      "😞": {
        dt: [1000, 1000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.7],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          eyesClosed: [0.5],
          bodyRotateX: [0.3],
          mouthClose: [0.2],
          mouthFrownLeft: [1],
          mouthFrownRight: [1],
          mouthPucker: [1],
          mouthRollLower: [1],
          mouthShrugLower: [0.2],
          mouthUpperUpLeft: [0.8],
          mouthUpperUpRight: [0.8],
        },
      },
      "😔": {
        dt: [1000, 1000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [1],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          eyesClosed: [0.5],
          bodyRotateX: [0.3],
          mouthClose: [0.2],
          mouthFrownLeft: [1],
          mouthFrownRight: [1],
          mouthPressLeft: [0.4],
          mouthPressRight: [0.4],
          mouthPucker: [1],
          mouthRollLower: [0.6],
          mouthRollUpper: [0.2],
          mouthUpperUpLeft: [0.8],
          mouthUpperUpRight: [0.8],
        },
      },
      "😳": {
        dt: [1000, 1000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [1],
          eyeWideLeft: [0.5],
          eyeWideRight: [0.5],
          eyesRotateY: [0.05],
          eyesRotateX: [0.05],
          mouthClose: [0.2],
          mouthFunnel: [0.5],
          mouthPucker: [0.4],
          mouthRollLower: [0.4],
          mouthRollUpper: [0.4],
        },
      },
      "☹️": { dt: [500, 1500], rescale: [0, 1], vs: { mouthFrownLeft: [1], mouthFrownRight: [1], mouthPucker: [0.1], mouthRollLower: [0.8] } },

      "😚": {
        dt: [500, 1000, 1000],
        rescale: [0, 1, 0],
        vs: {
          browInnerUp: [0.6],
          eyeBlinkLeft: [1],
          eyeBlinkRight: [1],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          mouthPucker: [0, 0.5],
          noseSneerLeft: [0, 0.7],
          noseSneerRight: [0, 0.7],
          viseme_U: [0, 1],
        },
      },
      "😘": {
        dt: [500, 500, 200, 500],
        rescale: [0, 0, 0, 1],
        vs: {
          browInnerUp: [0.6],
          eyeBlinkLeft: [0, 0, 1, 0],
          eyeBlinkRight: [0],
          eyesRotateY: [0],
          bodyRotateY: [0],
          bodyRotateX: [0, 0.05, 0.05, 0],
          bodyRotateZ: [0, -0.05, -0.05, 0],
          eyeSquintLeft: [1],
          eyeSquintRight: [1],
          mouthPucker: [0, 0.5, 0],
          noseSneerLeft: [0, 0.7],
          noseSneerRight: [0.7],
          viseme_U: [0, 1],
        },
      },
      "🥰": { dt: [1000, 1000], rescale: [0, 1], vs: { browInnerUp: [0.6], eyeSquintLeft: [1], eyeSquintRight: [1], mouthSmile: [0.7], noseSneerLeft: [0.7], noseSneerRight: [0.7] } },
      "😍": {
        dt: [1000, 1000],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.6],
          jawOpen: [0.1],
          mouthDimpleLeft: [0.2],
          mouthDimpleRight: [0.2],
          mouthOpen: [0.3],
          mouthPressLeft: [0.3],
          mouthPressRight: [0.3],
          mouthRollLower: [0.4],
          mouthShrugUpper: [0.4],
          mouthSmile: [0.7],
          mouthUpperUpLeft: [0.3],
          mouthUpperUpRight: [0.3],
          noseSneerLeft: [0.4],
          noseSneerRight: [0.4],
        },
      },
      "🤩": { link: "😍" },

      "😡": { dt: [1000, 1500], rescale: [0, 1], vs: { browDownLeft: [1], browDownRight: [1], eyesLookUp: [0.2], jawForward: [0.3], mouthFrownLeft: [1], mouthFrownRight: [1], bodyRotateX: [0.15] } },
      "😠": { dt: [1000, 1500], rescale: [0, 1], vs: { browDownLeft: [1], browDownRight: [1], eyesLookUp: [0.2], jawForward: [0.3], mouthFrownLeft: [1], mouthFrownRight: [1], bodyRotateX: [0.15] } },
      "🤬": { link: "😠" },
      "😒": {
        dt: [1000, 1000],
        rescale: [0, 1],
        vs: {
          eyeContact: [0],
          browDownRight: [0.1],
          browInnerUp: [0.7],
          browOuterUpRight: [0.2],
          eyeLookInRight: [0.7],
          eyeLookOutLeft: [0.7],
          eyeSquintLeft: [1],
          eyeSquintRight: [0.8],
          eyesRotateY: [0.7],
          mouthFrownLeft: [1],
          mouthFrownRight: [1],
          mouthLeft: [0.2],
          mouthPucker: [0.5],
          mouthRollLower: [0.2],
          mouthRollUpper: [0.2],
          mouthShrugLower: [0.2],
          mouthShrugUpper: [0.2],
          mouthStretchLeft: [0.5],
        },
      },

      "😱": { dt: [500, 1500], rescale: [0, 1], vs: { browInnerUp: [0.8], eyeWideLeft: [0.5], eyeWideRight: [0.5], jawOpen: [0.7], mouthFunnel: [0.5] } },
      "😬": {
        dt: [500, 1500],
        rescale: [0, 1],
        vs: {
          browDownLeft: [1],
          browDownRight: [1],
          browInnerUp: [1],
          mouthDimpleLeft: [0.5],
          mouthDimpleRight: [0.5],
          mouthLowerDownLeft: [1],
          mouthLowerDownRight: [1],
          mouthPressLeft: [0.4],
          mouthPressRight: [0.4],
          mouthPucker: [0.5],
          mouthSmile: [0.1],
          mouthSmileLeft: [0.2],
          mouthSmileRight: [0.2],
          mouthStretchLeft: [1],
          mouthStretchRight: [1],
          mouthUpperUpLeft: [1],
          mouthUpperUpRight: [1],
        },
      },
      "🙄": {
        dt: [500, 1500],
        rescale: [0, 1],
        vs: {
          browInnerUp: [0.8],
          eyeWideLeft: [1],
          eyeWideRight: [1],
          eyesRotateX: [-0.8],
          bodyRotateX: [0.15],
          mouthPucker: [0.5],
          mouthRollLower: [0.6],
          mouthRollUpper: [0.5],
          mouthShrugLower: [0],
          mouthSmile: [0],
        },
      },
      "🤔": {
        dt: [500, 1500],
        rescale: [0, 1],
        vs: {
          browDownLeft: [1],
          browOuterUpRight: [1],
          eyeSquintLeft: [0.6],
          mouthFrownLeft: [0.7],
          mouthFrownRight: [0.7],
          mouthLowerDownLeft: [0.3],
          mouthPressRight: [0.4],
          mouthPucker: [0.1],
          mouthRight: [0.5],
          mouthRollLower: [0.5],
          mouthRollUpper: [0.2],
          handRight: [{ x: 0.1, y: 0.1, z: 0.1, d: 1000 }, { d: 1000 }],
          handFistRight: [0.1],
        },
      },
      "👀": { dt: [500, 1500], rescale: [0, 1], vs: { eyesRotateY: [-0.8] } },

      "😴": { dt: [5000, 5000], rescale: [0, 1], vs: { eyeBlinkLeft: [1], eyeBlinkRight: [1], bodyRotateX: [0.2], bodyRotateZ: [0.1] } },

      "✋": { dt: [300, 2000], rescale: [0, 1], vs: { mouthSmile: [0.5], gesture: [["handup", 200, true], null] } },
      "🤚": { dt: [300, 2000], rescale: [0, 1], vs: { mouthSmile: [0.5], gesture: [["handup", 10], null] } },
      "👍": { dt: [300, 2000], rescale: [0, 1], vs: { mouthSmile: [0.5], gesture: [["thumbup", 2], null] } },
      "👎": {
        dt: [300, 2000],
        rescale: [0, 1],
        vs: { browDownLeft: [1], browDownRight: [1], eyesLookUp: [0.2], jawForward: [0.3], mouthFrownLeft: [1], mouthFrownRight: [1], bodyRotateX: [0.15], gesture: [["thumbdown", 2], null] },
      },
      "👌": { dt: [300, 2000], rescale: [0, 1], vs: { mouthSmile: [0.5], gesture: [["ok", 2], null] } },
      "🤷‍♂️": { dt: [1000, 1500], rescale: [0, 1], vs: { gesture: [["shrug", 2], null] } },
      "🤷‍♀️": { link: "🤷‍♂️" },
      "🤷": { link: "🤷‍♂️" },
      "🙏": { dt: [1500, 300, 1000], rescale: [0, 1, 0], vs: { eyeBlinkLeft: [0, 1], eyeBlinkRight: [0, 1], bodyRotateX: [0], bodyRotateZ: [0.1], gesture: [["namaste", 2], null] } },

      yes: {
        dt: [
          [200, 500],
          [200, 500],
          [200, 500],
          [200, 500],
        ],
        vs: { headMove: [0], headRotateX: [[0.1, 0.2], 0.1, [0.1, 0.2], 0], headRotateZ: [[-0.2, 0.2]] },
      },
      no: {
        dt: [
          [200, 500],
          [200, 500],
          [200, 500],
          [200, 500],
          [200, 500],
        ],
        vs: { headMove: [0], headRotateY: [[-0.1, -0.05], [0.05, 0.1], [-0.1, -0.05], [0.05, 0.1], 0], headRotateZ: [[-0.2, 0.2]] },
      },
    };

    // Morph targets
    this.mtAvatar = {};
    this.mtCustoms = ["handFistLeft", "handFistRight", "bodyRotateX", "bodyRotateY", "bodyRotateZ", "headRotateX", "headRotateY", "headRotateZ", "chestInhale"];
    this.mtEasingDefault = this.sigmoidFactory(5); // Morph target default ease in/out
    this.mtAccDefault = 0.01; // Acceleration [rad / s^2]
    this.mtAccExceptions = {
      eyeBlinkLeft: 0.1,
      eyeBlinkRight: 0.1,
      eyeLookOutLeft: 0.1,
      eyeLookInLeft: 0.1,
      eyeLookOutRight: 0.1,
      eyeLookInRight: 0.1,
    };
    this.mtMaxVDefault = 5; // Maximum velocity [rad / s]
    this.mtMaxVExceptions = {
      bodyRotateX: 1,
      bodyRotateY: 1,
      bodyRotateZ: 1,
      // headRotateX: 1, headRotateY: 1, headRotateZ: 1
    };
    this.mtBaselineDefault = 0; // Default baseline value
    this.mtBaselineExceptions = {
      bodyRotateX: null,
      bodyRotateY: null,
      bodyRotateZ: null,
      eyeLookOutLeft: null,
      eyeLookInLeft: null,
      eyeLookOutRight: null,
      eyeLookInRight: null,
      eyesLookDown: null,
      eyesLookUp: null,
    };
    this.mtMinDefault = 0;
    this.mtMinExceptions = {
      bodyRotateX: -1,
      bodyRotateY: -1,
      bodyRotateZ: -1,
      headRotateX: -1,
      headRotateY: -1,
      headRotateZ: -1,
    };
    this.mtMaxDefault = 1;
    this.mtMaxExceptions = {};
    this.mtLimits = {
      // eyeBlinkLeft: v => Math.max(v, (this.mtAvatar["eyesLookDown"].value + this.mtAvatar["browDownLeft"].value) / 2),
      // eyeBlinkRight: v => Math.max(v, (this.mtAvatar["eyesLookDown"].value + this.mtAvatar["browDownRight"].value) / 2),
    };
    this.mtOnchange = {
      eyesLookDown: () => {
        this.mtAvatar["eyeBlinkLeft"].needsUpdate = true;
        this.mtAvatar["eyeBlinkRight"].needsUpdate = true;
      },
      browDownLeft: () => {
        this.mtAvatar["eyeBlinkLeft"].needsUpdate = true;
      },
      browDownRight: () => {
        this.mtAvatar["eyeBlinkRight"].needsUpdate = true;
      },
    };
    this.mtRandomized = [
      "mouthDimpleLeft",
      "mouthDimpleRight",
      "mouthLeft",
      "mouthPressLeft",
      "mouthPressRight",
      "mouthStretchLeft",
      "mouthStretchRight",
      "mouthShrugLower",
      "mouthShrugUpper",
      "noseSneerLeft",
      "noseSneerRight",
      "mouthRollLower",
      "mouthRollUpper",
      "browDownLeft",
      "browDownRight",
      "browOuterUpLeft",
      "browOuterUpRight",
      "cheekPuff",
      "cheekSquintLeft",
      "cheekSquintRight",
    ];

    // Anim queues
    this.animQueue = [];
    this.animClips = [];
    this.animPoses = [];

    // Clock
    this.animFrameDur = 1000 / this.opt.modelFPS;
    this.animClock = 0;
    this.animSlowdownRate = 1;
    this.animTimeLast = 0;
    this.easing = this.sigmoidFactory(5); // Ease in and out

    // Lip-sync extensions, import dynamically
    this.lipsync = {};
    this.opt.lipsyncModules.forEach(x => this.lipsyncGetProcessor(x));
    this.visemeNames = ["aa", "E", "I", "O", "U", "PP", "SS", "TH", "DD", "FF", "kk", "nn", "RR", "CH", "sil"];

    // Audio context and playlist
    this.initAudioGraph();
    this.audioPlaylist = [];

    // Volume based head movement
    this.volumeFrequencyData = new Uint8Array(16);
    this.volumeMax = 0;
    this.volumeHeadBase = 0;
    this.volumeHeadTarget = 0;
    this.volumeHeadCurrent = 0;
    this.volumeHeadVelocity = 0.15;
    this.volumeHeadEasing = this.sigmoidFactory(3);

    // Listening
    this.isListening = false;
    this.listeningAnalyzer = null;
    this.listeningActive = false;
    this.listeningVolume = 0;
    this.listeningSilenceThresholdLevel = this.opt.listeningSilenceThresholdLevel;
    this.listeningSilenceThresholdMs = this.opt.listeningSilenceThresholdMs;
    this.listeningSilenceDurationMax = this.opt.listeningSilenceDurationMax;
    this.listeningActiveThresholdLevel = this.opt.listeningActiveThresholdLevel;
    this.listeningActiveThresholdMs = this.opt.listeningActiveThresholdMs;
    this.listeningActiveDurationMax = this.opt.listeningActiveDurationMax;
    this.listeningTimer = 0;
    this.listeningTimerTotal = 0;

    // Draco loading
    this.dracoEnabled = this.opt.dracoEnabled;
    this.dracoDecoderPath = this.opt.dracoDecoderPath;

    // Create a lookup table for base64 decoding
    const b64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    this.b64Lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
    for (let i = 0; i < b64Chars.length; i++) this.b64Lookup[b64Chars.charCodeAt(i)] = i;

    // Speech queue
    this.stateName = "idle";
    this.speechQueue = [];
    this.isSpeaking = false;
    this.isListening = false;

    // Setup Google text-to-speech
    if (this.opt.ttsEndpoint) {
      let audio = new Audio();
      if (audio.canPlayType("audio/ogg")) {
        this.ttsAudioEncoding = "OGG-OPUS";
      } else if (audio.canPlayType("audio/mp3")) {
        this.ttsAudioEncoding = "MP3";
      } else {
        throw new Error("There was no support for either OGG or MP3 audio.");
      }
    } else {
      throw new Error("You must provide some Google-compliant Text-To-Speech Endpoint.");
    }

    // Setup 3D Animation
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(this.opt.modelPixelRatio * window.devicePixelRatio);
    this.renderer.setSize(this.nodeAvatar.clientWidth, this.nodeAvatar.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = false;

    this.nodeAvatar.appendChild(this.renderer.domElement);
    // === CSS2D 渲染器（文字标签层） ===
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.nodeAvatar.clientWidth, this.nodeAvatar.clientHeight);
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = "0";
    this.labelRenderer.domElement.style.pointerEvents = "none";
    this.nodeAvatar.appendChild(this.labelRenderer.domElement);

    this.camera = new THREE.PerspectiveCamera(10, this.nodeAvatar.clientWidth / this.nodeAvatar.clientHeight, 0.1, 2000);
    this.scene = new THREE.Scene();

    this.lightAmbient = new THREE.AmbientLight(new THREE.Color(this.opt.lightAmbientColor), this.opt.lightAmbientIntensity);
    this.lightDirect = new THREE.DirectionalLight(new THREE.Color(this.opt.lightDirectColor), this.opt.lightDirectIntensity);
    this.lightSpot = new THREE.SpotLight(new THREE.Color(this.opt.lightSpotColor), this.opt.lightSpotIntensity, 0, this.opt.lightSpotDispersion);
    // 设置光照方向（从右上方照射）
    this.lightDirect.position.set(5, 10, 5);
    this.setLighting(this.opt);

    this.resizeobserver = new ResizeObserver(this.onResize.bind(this));
    this.resizeobserver.observe(this.nodeAvatar);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = this.opt.cameraZoomEnable;
    this.controls.enableRotate = this.opt.cameraRotateEnable;
    this.controls.enablePan = this.opt.cameraPanEnable;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 2000;
    this.controls.autoRotateSpeed = 0;
    this.controls.autoRotate = false;

    // 关键设置：锁死上下角度（只允许水平旋转）
    this.controls.minPolarAngle = Math.PI / 2; // 90 度
    this.controls.maxPolarAngle = Math.PI / 2; // 90 度
    // this.controls.minAzimuthAngle = 0; // 左右角度固定
    // this.controls.maxAzimuthAngle = 0;
    this.controls.update();

    this.cameraClock = null;

    // IK Mesh
    this.ikMesh = new THREE.SkinnedMesh();
    const ikSetup = {
      LeftShoulder: null,
      LeftArm: "LeftShoulder",
      LeftForeArm: "LeftArm",
      LeftHand: "LeftForeArm",
      LeftHandMiddle1: "LeftHand",
      RightShoulder: null,
      RightArm: "RightShoulder",
      RightForeArm: "RightArm",
      RightHand: "RightForeArm",
      RightHandMiddle1: "RightHand",
    };
    const ikBones = [];
    Object.entries(ikSetup).forEach((x, i) => {
      const bone = new THREE.Bone();
      bone.name = x[0];
      if (x[1]) {
        this.ikMesh.getObjectByName(x[1]).add(bone);
      } else {
        this.ikMesh.add(bone);
      }
      ikBones.push(bone);
    });
    this.ikMesh.bind(new THREE.Skeleton(ikBones));

    // Dynamic Bones
    this.dynamicbones = new DynamicBones();

    // Stream speech mode
    this.isStreaming = false;
    this.streamWorkletNode = null;
    this.streamAudioStartTime = 0;
    this.streamLipsyncLang = null;
    this.streamLipsyncType = "visemes";
    this.streamLipsyncQueue = [];
  }

  initAudioGraph(sampleRate = null) {
    // Close existing context if it exists
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close();
    }

    // Create a new context
    if (sampleRate) {
      this.audioCtx = new AudioContext({ sampleRate });
    } else {
      this.audioCtx = new AudioContext();
    }

    // Create audio nodes
    this.audioSpeechSource = this.audioCtx.createBufferSource();
    this.audioBackgroundSource = this.audioCtx.createBufferSource();
    this.audioBackgroundGainNode = this.audioCtx.createGain();
    this.audioSpeechGainNode = this.audioCtx.createGain();
    this.audioStreamGainNode = this.audioCtx.createGain();
    this.audioAnalyzerNode = this.audioCtx.createAnalyser();
    this.audioAnalyzerNode.fftSize = 256;
    this.audioAnalyzerNode.smoothingTimeConstant = 0.1;
    this.audioAnalyzerNode.minDecibels = -70;
    this.audioAnalyzerNode.maxDecibels = -10;
    this.audioReverbNode = this.audioCtx.createConvolver();

    // Connect nodes
    this.audioBackgroundGainNode.connect(this.audioReverbNode);
    this.audioAnalyzerNode.connect(this.audioSpeechGainNode);
    this.audioSpeechGainNode.connect(this.audioReverbNode);
    this.audioStreamGainNode.connect(this.audioReverbNode);
    this.audioReverbNode.connect(this.audioCtx.destination);

    // Apply reverb and mixer settings
    this.setReverb(this.currentReverb || null);
    this.setMixerGain(this.opt.mixerGainSpeech, this.opt.mixerGainBackground);

    // Reset stream worklet loaded flag to reload with the new context
    this.workletLoaded = false;
  }

  valueFn(x) {
    return typeof x === "function" ? x() : x;
  }

  deepCopy(x, editFn = null) {
    const o = JSON.parse(JSON.stringify(x));
    if (editFn && typeof editFn === "function") editFn(o);
    return o;
  }

  b64ToArrayBuffer(chunk) {
    // Calculate the needed total buffer length
    let bufLen = (3 * chunk.length) / 4;
    if (chunk[chunk.length - 1] === "=") {
      bufLen--;
      if (chunk[chunk.length - 2] === "=") {
        bufLen--;
      }
    }

    // Create the ArrayBuffer
    const arrBuf = new ArrayBuffer(bufLen);
    const arr = new Uint8Array(arrBuf);
    let i,
      p = 0,
      c1,
      c2,
      c3,
      c4;

    // Populate the buffer
    for (i = 0; i < chunk.length; i += 4) {
      c1 = this.b64Lookup[chunk.charCodeAt(i)];
      c2 = this.b64Lookup[chunk.charCodeAt(i + 1)];
      c3 = this.b64Lookup[chunk.charCodeAt(i + 2)];
      c4 = this.b64Lookup[chunk.charCodeAt(i + 3)];
      arr[p++] = (c1 << 2) | (c2 >> 4);
      arr[p++] = ((c2 & 15) << 4) | (c3 >> 2);
      arr[p++] = ((c3 & 3) << 6) | (c4 & 63);
    }

    return arrBuf;
  }

  concatArrayBuffers(bufs) {
    if (bufs.length === 1) return bufs[0];
    let len = 0;
    for (let i = 0; i < bufs.length; i++) {
      len += bufs[i].byteLength;
    }
    let buf = new ArrayBuffer(len);
    let arr = new Uint8Array(buf);
    let p = 0;
    for (let i = 0; i < bufs.length; i++) {
      arr.set(new Uint8Array(bufs[i]), p);
      p += bufs[i].byteLength;
    }
    return buf;
  }

  pcmToAudioBuffer(buf) {
    const arr = new Int16Array(buf);
    const floats = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      floats[i] = arr[i] >= 0x8000 ? -(0x10000 - arr[i]) / 0x8000 : arr[i] / 0x7fff;
    }
    const audio = this.audioCtx.createBuffer(1, floats.length, this.opt.pcmSampleRate);
    audio.copyToChannel(floats, 0, 0);
    return audio;
  }

  propsToThreeObjects(p) {
    const r = {};
    for (let [key, val] of Object.entries(p)) {
      const ids = key.split(".");
      let x = Array.isArray(val.x) ? this.gaussianRandom(...val.x) : val.x;
      let y = Array.isArray(val.y) ? this.gaussianRandom(...val.y) : val.y;
      let z = Array.isArray(val.z) ? this.gaussianRandom(...val.z) : val.z;

      if (ids[1] === "position" || ids[1] === "scale") {
        r[key] = new THREE.Vector3(x, y, z);
      } else if (ids[1] === "rotation") {
        key = ids[0] + ".quaternion";
        r[key] = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ")).normalize();
      } else if (ids[1] === "quaternion") {
        r[key] = new THREE.Quaternion(x, y, z, val.w).normalize();
      }
    }

    return r;
  }

  clearThree(obj) {
    while (obj.children.length) {
      this.clearThree(obj.children[0]);
      obj.remove(obj.children[0]);
    }
    if (obj.geometry) obj.geometry.dispose();

    if (obj.material) {
      Object.keys(obj.material).forEach(x => {
        if (obj.material[x] && obj.material[x] !== null && typeof obj.material[x].dispose === "function") {
          obj.material[x].dispose();
        }
      });
      obj.material.dispose();
    }
  }

  async showAvatar(avatar, onprogress = null) {
    if (!avatar || !avatar.hasOwnProperty("url")) {
      throw new Error("Invalid parameter. The avatar must have at least 'url' specified.");
    }
    const loader = new GLTFLoader();
    if (this.dracoEnabled) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(this.dracoDecoderPath);
      loader.setDRACOLoader(dracoLoader);
    }
    let gltf = await loader.loadAsync(avatar.url, onprogress);
    this.model = gltf.scene;
    this.scene.add(this.model);
    // this.setLogo("/image/bnb.png");

    // Check the gltf
    const required = [this.opt.modelRoot];
    this.posePropNames.forEach(x => required.push(x.split(".")[0]));
    required.forEach(x => {
      if (!gltf.scene.getObjectByName(x)) {
        throw new Error("Avatar object " + x + " not found");
      }
    });

    this.stop();
    this.avatar = avatar;

    // Dispose Dynamic Bones
    this.dynamicbones.dispose();

    // Clear previous scene, if avatar was previously loaded
    this.mixer = null;
    if (this.armature) {
      this.clearThree(this.scene);
    }

    // Avatar full-body
    this.armature = gltf.scene.getObjectByName(this.opt.modelRoot);
    this.armature?.scale.setScalar(1);

    // Morph targets
    this.morphs = [];
    this.armature?.traverse(x => {
      if (x.morphTargetInfluences && x.morphTargetInfluences.length && x.morphTargetDictionary) {
        this.morphs.push(x);
      }
      // Workaround for #40, hands culled from the rendering process
      x.frustumCulled = false;
    });
    if (this.morphs.length === 0) {
      throw new Error("Blend shapes not found");
    }

    // Morph target keys and values
    const keys = new Set(this.mtCustoms);
    this.morphs.forEach(x => {
      Object.keys(x.morphTargetDictionary).forEach(y => keys.add(y));
    });
    const mtTemp = {};
    keys.forEach(x => {
      // Morph target data structure
      mtTemp[x] = {
        fixed: null,
        system: null,
        systemd: null,
        newvalue: null,
        ref: null,
        min: this.mtMinExceptions.hasOwnProperty(x) ? this.mtMinExceptions[x] : this.mtMinDefault,
        max: this.mtMaxExceptions.hasOwnProperty(x) ? this.mtMaxExceptions[x] : this.mtMaxDefault,
        easing: this.mtEasingDefault,
        base: null,
        v: 0,
        needsUpdate: true,
        acc: (this.mtAccExceptions.hasOwnProperty(x) ? this.mtAccExceptions[x] : this.mtAccDefault) / 1000,
        maxv: (this.mtMaxVExceptions.hasOwnProperty(x) ? this.mtMaxVExceptions[x] : this.mtMaxVDefault) / 1000,
        limit: this.mtLimits.hasOwnProperty(x) ? this.mtLimits[x] : null,
        onchange: this.mtOnchange.hasOwnProperty(x) ? this.mtOnchange[x] : null,
        baseline: this.avatar.baseline?.hasOwnProperty(x) ? this.avatar.baseline[x] : this.mtBaselineExceptions.hasOwnProperty(x) ? this.mtBaselineExceptions[x] : this.mtBaselineDefault,
        ms: [],
        is: [],
      };
      mtTemp[x].value = mtTemp[x].baseline;
      mtTemp[x].applied = mtTemp[x].baseline;

      // Copy previous values
      const y = this.mtAvatar[x];
      if (y) {
        ["fixed", "system", "systemd", "base", "v", "value", "applied"].forEach(z => {
          mtTemp[x][z] = y[z];
        });
      }

      // Find relevant meshes
      this.morphs.forEach(y => {
        const ndx = y.morphTargetDictionary[x];
        if (ndx !== undefined) {
          mtTemp[x].ms.push(y.morphTargetInfluences);
          mtTemp[x].is.push(ndx);
          y.morphTargetInfluences[ndx] = mtTemp[x].applied;
        }
      });
    });
    this.mtAvatar = mtTemp;

    // Objects for needed properties
    this.poseAvatar = { props: {} };
    this.posePropNames.forEach(x => {
      const ids = x.split(".");
      const o = this.armature.getObjectByName(ids[0]);
      this.poseAvatar.props[x] = o[ids[1]];
      if (this.poseBase.props.hasOwnProperty(x)) {
        this.poseAvatar.props[x].copy(this.poseBase.props[x]);
      } else {
        this.poseBase.props[x] = this.poseAvatar.props[x].clone();
      }

      // Make sure the target has the delta properties, because we need it as a basis
      if (this.poseDelta.props.hasOwnProperty(x) && !this.poseTarget.props.hasOwnProperty(x)) {
        this.poseTarget.props[x] = this.poseAvatar.props[x].clone();
      }

      // Take target pose
      this.poseTarget.props[x].t = this.animClock;
      this.poseTarget.props[x].d = 2000;
    });

    // Reset IK bone positions
    this.ikMesh.traverse(x => {
      if (x.isBone) {
        x.position.copy(this.armature.getObjectByName(x.name).position);
      }
    });

    // Add avatar to scene
    this.scene.add(gltf.scene);

    // Add lights
    this.scene.add(this.lightAmbient);
    this.scene.add(this.lightDirect);
    // this.scene.add(this.lightSpot);
    // this.lightSpot.target = this.armature.getObjectByName("Head");

    // Setup Dynamic Bones
    if (avatar.hasOwnProperty("modelDynamicBones")) {
      try {
        this.dynamicbones.setup(this.scene, this.armature, avatar.modelDynamicBones);
      } catch (error) {
        console.error("Dynamic bones setup failed: " + error);
      }
    }

    // Find objects that we need in the animate function
    this.objectLeftToeBase = this.armature.getObjectByName("LeftToeBase");
    this.objectRightToeBase = this.armature.getObjectByName("RightToeBase");
    this.objectLeftEye = this.armature.getObjectByName("LeftEye");
    this.objectRightEye = this.armature.getObjectByName("RightEye");
    this.objectLeftArm = this.armature.getObjectByName("LeftArm");
    this.objectRightArm = this.armature.getObjectByName("RightArm");
    this.objectHips = this.armature.getObjectByName("Hips");
    this.objectHead = this.armature.getObjectByName("Head");
    this.objectNeck = this.armature.getObjectByName("Neck");

    // Estimate avatar height based on eye level
    const plEye = new THREE.Vector3();
    this.objectLeftEye.getWorldPosition(plEye);
    this.avatarHeight = plEye.y + 0.2;

    if (avatar.enableStrongLight) {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;
    }

    // Set pose, view and start animation
    if (!this.viewName) this.setView(this.opt.cameraView);
    this.setMood(this.avatar.avatarMood || this.moodName || this.opt.avatarMood);
    this.start();
    this.enableClickDetection();
  }

  async setVehicle(url = "/model/bic_car.glb", rotation = { x: 0, y: -0.6, z: 0 }, position = { x: -1, y: 0.5, z: -2 }) {
    const loader = new GLTFLoader();
    let { scene: Vehicle } = await loader.loadAsync(url);
    Vehicle.rotation.set(rotation.x, rotation.y, rotation.z);
    Vehicle.position.set(position.x, position.y, position.z);
    this.scene.add(Vehicle);
  }

  setLogo(blob) {
    if (this.logo) this.logo = null;
    let isblob = false;
    let url = blob;
    // 判断blob 是blob类型还是string类型
    if (typeof blob !== "string") {
      isblob = true;
      url = URL.createObjectURL(blob);
    }

    // 创建 logo 平面
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load(
      url,
      () => {
        if (isblob) {
          URL.revokeObjectURL(url);
        }
      },
      undefined,
      err => {
        console.error("加载 logo 失败: " + err);
      },
    );
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    this.logo = new THREE.Mesh(
      new THREE.CircleGeometry(0.03, 64), // 尺寸可调
      new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );

    // 获取胸部骨骼
    const chestBone = this.model.getObjectByName("Spine2");
    if (!chestBone) {
      console.error("未找到 Spine2 骨骼");
      return;
    }

    // 添加到骨骼下
    chestBone.add(this.logo);

    // 调整 logo 的相对位置（试着微调到左胸）
    this.logo.position.set(0.11, 0.1, 0.1); // X向左/右，Y向上/下，Z向前/后
    this.logo.rotation.y = Math.PI * 0.12; // 稍微朝外倾斜一点
    this.logo.rotation.x = -Math.PI * 0.12; // 稍微朝外倾斜一点
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    // === 鼠标事件监听 ===
    window.addEventListener("click", event => {
      // 将鼠标坐标归一化到 [-1, 1]
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 用摄像机和鼠标位置更新射线
      raycaster.setFromCamera(mouse, this.camera);

      // 检测点击的对象
      if (!this.logo) return;
      const intersects = raycaster.intersectObject(this.logo, true);

      if (intersects.length > 0) {
        console.log("🎯 点击到 logo！");
      }
    });
  }

  enableClickDetection() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener("click", event => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObjects(this.scene.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
      }
    });
  }

  getViewNames() {
    return ["full", "mid", "upper", "head"];
  }

  getView() {
    return this.viewName;
  }

  setView(view, opt = null) {
    if (view !== "full" && view !== "upper" && view !== "head" && view !== "mid") return;
    if (!this.armature) {
      this.opt.cameraView = view;
      return;
    }

    this.viewName = view || this.viewName;
    opt = opt || {};

    const fov = this.camera.fov * (Math.PI / 180);
    let x = -(opt.cameraX || this.opt.cameraX) * Math.tan(fov / 2);
    let y = (1 - (opt.cameraY || this.opt.cameraY)) * Math.tan(fov / 2);
    let z = opt.cameraDistance || this.opt.cameraDistance;

    switch (this.viewName) {
      case "head":
        z += 2;
        y = y * z + (4 * this.avatarHeight) / 5;
        break;
      case "upper":
        z += 4.5;
        y = y * z + (2 * this.avatarHeight) / 3;
        break;
      case "mid":
        z += 8;
        y = y * z + this.avatarHeight / 3;
        break;
      default:
        z += 12;
        y = y * z;
    }

    x = x * z;

    this.controlsEnd = new THREE.Vector3(x, y, 0);
    this.cameraEnd = new THREE.Vector3(x, y, z).applyEuler(new THREE.Euler(opt.cameraRotateX || this.opt.cameraRotateX, opt.cameraRotateY || this.opt.cameraRotateY, 0));

    if (this.cameraClock === null) {
      this.controls.target.copy(this.controlsEnd);
      this.camera.position.copy(this.cameraEnd);
    }
    this.controlsStart = this.controls.target.clone();
    this.cameraStart = this.camera.position.clone();
    this.cameraClock = 0;
  }

  setLighting(opt) {
    opt = opt || {};
    // Ambient light
    if (opt.hasOwnProperty("lightAmbientColor")) {
      this.lightAmbient.color.set(new THREE.Color(opt.lightAmbientColor));
    }
    if (opt.hasOwnProperty("lightAmbientIntensity")) {
      this.lightAmbient.intensity = opt.lightAmbientIntensity;
      this.lightAmbient.visible = opt.lightAmbientIntensity !== 0;
    }
    // Directional light
    if (opt.hasOwnProperty("lightDirectColor")) {
      this.lightDirect.color.set(new THREE.Color(opt.lightDirectColor));
    }
    if (opt.hasOwnProperty("lightDirectIntensity")) {
      this.lightDirect.intensity = opt.lightDirectIntensity;
      this.lightDirect.visible = opt.lightDirectIntensity !== 0;
    }
    if (opt.hasOwnProperty("lightDirectPhi") && opt.hasOwnProperty("lightDirectTheta")) {
      this.lightDirect.position.setFromSphericalCoords(2, opt.lightDirectPhi, opt.lightDirectTheta);
    }
    // Spot light
    if (opt.hasOwnProperty("lightSpotColor")) {
      this.lightSpot.color.set(new THREE.Color(opt.lightSpotColor));
    }
    if (opt.hasOwnProperty("lightSpotIntensity")) {
      this.lightSpot.intensity = opt.lightSpotIntensity;
      this.lightSpot.visible = opt.lightSpotIntensity !== 0;
    }
    if (opt.hasOwnProperty("lightSpotPhi") && opt.hasOwnProperty("lightSpotTheta")) {
      this.lightSpot.position.setFromSphericalCoords(2, opt.lightSpotPhi, opt.lightSpotTheta);
      this.lightSpot.position.add(new THREE.Vector3(0, 1.5, 0));
    }
    if (opt.hasOwnProperty("lightSpotDispersion")) {
      this.lightSpot.angle = opt.lightSpotDispersion;
    }
  }

  render() {
    if (this.isRunning) {
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    this.camera.aspect = this.nodeAvatar.clientWidth / this.nodeAvatar.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.nodeAvatar.clientWidth, this.nodeAvatar.clientHeight);
    this.controls.update();
    this.render();
  }

  updatePoseBase(t) {
    for (const [key, val] of Object.entries(this.poseTarget.props)) {
      const o = this.poseAvatar.props[key];
      if (o) {
        let alpha = (t - val.t) / val.d;
        if (alpha > 1 || !this.poseBase.props.hasOwnProperty(key)) {
          o.copy(val);
        } else {
          if (o.isQuaternion) {
            o.copy(this.poseBase.props[key].slerp(val, this.easing(alpha)));
          } else if (o.isVector3) {
            o.copy(this.poseBase.props[key].lerp(val, this.easing(alpha)));
          }
        }
      }
    }
  }

  updatePoseDelta() {
    for (const [key, d] of Object.entries(this.poseDelta.props)) {
      if (d.x === 0 && d.y === 0 && d.z === 0) continue;
      e.set(d.x, d.y, d.z);
      const o = this.poseAvatar.props[key];
      if (o.isQuaternion) {
        q.setFromEuler(e);
        o.multiply(q);
      } else if (o.isVector3) {
        o.add(e);
      }
    }
  }

  updateMorphTargets(dt) {
    for (let [mt, o] of Object.entries(this.mtAvatar)) {
      if (!o.needsUpdate) continue;

      // Alternative target (priority order):
      // - fixed: Fixed value, typically user controlled
      // - system: System value, which overrides animations
      // - newvalue: Animation value
      // - baseline: Baseline value when none of the above applies
      let target = null;
      let newvalue = null;
      if (o.fixed !== null) {
        target = o.fixed;
        o.system = null;
        o.systemd = null;
        o.newvalue = null;
        if (o.ref && o.ref.hasOwnProperty(mt)) delete o.ref[mt];
        o.ref = null;
        o.base = null;
        if (o.value === target) {
          o.needsUpdate = false;
          continue;
        }
      } else if (o.system !== null) {
        target = o.system;
        o.newvalue = null;
        if (o.ref && o.ref.hasOwnProperty(mt)) delete o.ref[mt];
        o.ref = null;
        o.base = null;
        if (o.systemd !== null) {
          if (o.systemd === 0) {
            target = null;
            o.system = null;
            o.systemd = null;
          } else {
            o.systemd -= dt;
            if (o.systemd < 0) o.systemd = 0;
            if (o.value === target) {
              target = null;
            }
          }
        } else if (o.value === target) {
          target = null;
          o.system = null;
        }
      } else if (o.newvalue !== null) {
        o.ref = null;
        o.base = null;
        newvalue = o.newvalue;
        o.newvalue = null;
      } else if (o.base !== null) {
        target = o.base;
        o.ref = null;
        if (o.value === target) {
          target = null;
          o.base = null;
          o.needsUpdate = false;
        }
      } else {
        o.ref = null;
        if (o.baseline !== null && o.value !== o.baseline) {
          target = o.baseline;
          o.base = o.baseline;
        } else {
          o.needsUpdate = false;
        }
      }

      // Calculate new value using exponential smoothing
      if (target !== null) {
        let diff = target - o.value;
        if (diff >= 0) {
          if (diff < 0.005) {
            newvalue = target;
            o.v = 0;
          } else {
            if (o.v < o.maxv) o.v += o.acc * dt;
            if (o.v >= 0) {
              newvalue = o.value + diff * (1 - Math.exp(-o.v * dt));
            } else {
              newvalue = o.value + o.v * dt * (1 - Math.exp(o.v * dt));
            }
          }
        } else {
          if (diff > -0.005) {
            newvalue = target;
            o.v = 0;
          } else {
            if (o.v > -o.maxv) o.v -= o.acc * dt;
            if (o.v >= 0) {
              newvalue = o.value + o.v * dt * (1 - Math.exp(-o.v * dt));
            } else {
              newvalue = o.value + diff * (1 - Math.exp(o.v * dt));
            }
          }
        }
      }

      // Check limits and whether we need to actually update the morph target
      if (o.limit !== null) {
        if (newvalue !== null && newvalue !== o.value) {
          o.value = newvalue;
          if (o.onchange !== null) o.onchange(newvalue);
        }
        newvalue = o.limit(o.value);
        if (newvalue === o.applied) continue;
      } else {
        if (newvalue === null || newvalue === o.value) continue;
        o.value = newvalue;
        if (o.onchange !== null) o.onchange(newvalue);
      }

      o.applied = newvalue;
      if (o.applied < o.min) o.applied = o.min;
      if (o.applied > o.max) o.applied = o.max;

      // Apply value
      switch (mt) {
        case "headRotateX":
          this.poseDelta.props["Head.quaternion"].x = o.applied + this.mtAvatar["bodyRotateX"].applied;
          break;

        case "headRotateY":
          this.poseDelta.props["Head.quaternion"].y = o.applied + this.mtAvatar["bodyRotateY"].applied;
          break;

        case "headRotateZ":
          this.poseDelta.props["Head.quaternion"].z = o.applied + this.mtAvatar["bodyRotateZ"].applied;
          break;

        case "bodyRotateX":
          this.poseDelta.props["Head.quaternion"].x = o.applied + this.mtAvatar["headRotateX"].applied;
          this.poseDelta.props["Spine1.quaternion"].x = o.applied / 2;
          this.poseDelta.props["Spine.quaternion"].x = o.applied / 8;
          this.poseDelta.props["Hips.quaternion"].x = o.applied / 24;
          break;

        case "bodyRotateY":
          this.poseDelta.props["Head.quaternion"].y = o.applied + this.mtAvatar["headRotateY"].applied;
          this.poseDelta.props["Spine1.quaternion"].y = o.applied / 2;
          this.poseDelta.props["Spine.quaternion"].y = o.applied / 2;
          this.poseDelta.props["Hips.quaternion"].y = o.applied / 4;
          this.poseDelta.props["LeftUpLeg.quaternion"].y = o.applied / 2;
          this.poseDelta.props["RightUpLeg.quaternion"].y = o.applied / 2;
          this.poseDelta.props["LeftLeg.quaternion"].y = o.applied / 4;
          this.poseDelta.props["RightLeg.quaternion"].y = o.applied / 4;
          break;

        case "bodyRotateZ":
          this.poseDelta.props["Head.quaternion"].z = o.applied + this.mtAvatar["headRotateZ"].applied;
          this.poseDelta.props["Spine1.quaternion"].z = o.applied / 12;
          this.poseDelta.props["Spine.quaternion"].z = o.applied / 12;
          this.poseDelta.props["Hips.quaternion"].z = o.applied / 24;
          break;

        case "handFistLeft":
        case "handFistRight":
          const side = mt.substring(8);
          ["HandThumb", "HandIndex", "HandMiddle", "HandRing", "HandPinky"].forEach((x, i) => {
            if (i === 0) {
              this.poseDelta.props[side + x + "1.quaternion"].x = 0;
              this.poseDelta.props[side + x + "2.quaternion"].z = (side === "Left" ? -1 : 1) * o.applied;
              this.poseDelta.props[side + x + "3.quaternion"].z = (side === "Left" ? -1 : 1) * o.applied;
            } else {
              this.poseDelta.props[side + x + "1.quaternion"].x = o.applied;
              this.poseDelta.props[side + x + "2.quaternion"].x = 1.5 * o.applied;
              this.poseDelta.props[side + x + "3.quaternion"].x = 1.5 * o.applied;
            }
          });
          break;

        case "chestInhale":
          const scale = o.applied / 20;
          const d = { x: scale, y: scale / 2, z: 3 * scale };
          const dneg = { x: 1 / (1 + scale) - 1, y: 1 / (1 + scale / 2) - 1, z: 1 / (1 + 3 * scale) - 1 };
          this.poseDelta.props["Spine1.scale"] = d;
          this.poseDelta.props["Neck.scale"] = dneg;
          this.poseDelta.props["LeftArm.scale"] = dneg;
          this.poseDelta.props["RightArm.scale"] = dneg;
          break;

        default:
          for (let i = 0, l = o.ms.length; i < l; i++) {
            o.ms[i][o.is[i]] = o.applied;
          }
      }
    }
  }

  getPoseString(pose, prec = 1000) {
    let s = "{";
    Object.entries(pose).forEach((x, i) => {
      const ids = x[0].split(".");
      if (ids[1] === "position" || ids[1] === "rotation" || ids[1] === "quaternion") {
        const key = ids[1] === "quaternion" ? ids[0] + ".rotation" : x[0];
        const val = x[1].isQuaternion ? new THREE.Euler().setFromQuaternion(x[1]) : x[1];
        s += (i ? ", " : "") + "'" + key + "':{";
        s += "x:" + Math.round(val.x * prec) / prec;
        s += ", y:" + Math.round(val.y * prec) / prec;
        s += ", z:" + Math.round(val.z * prec) / prec;
        s += "}";
      }
    });
    s += "}";
    return s;
  }

  getPoseTemplateProp(key) {
    const ids = key.split(".");
    let target = ids[0] + "." + (ids[1] === "rotation" ? "quaternion" : ids[1]);

    if (this.gesture && this.gesture.hasOwnProperty(target)) {
      return this.gesture[target].clone();
    } else {
      let source = ids[0] + "." + (ids[1] === "quaternion" ? "rotation" : ids[1]);
      if (!this.poseWeightOnLeft) {
        if (source.startsWith("Left")) {
          source = "Right" + source.substring(4);
          target = "Right" + target.substring(4);
        } else if (source.startsWith("Right")) {
          source = "Left" + source.substring(5);
          target = "Left" + target.substring(5);
        }
      }

      // Get value
      let val;
      if (this.poseTarget.template.props.hasOwnProperty(target)) {
        const o = {};
        o[target] = this.poseTarget.template.props[target];
        val = this.propsToThreeObjects(o)[target];
      } else if (this.poseTarget.template.props.hasOwnProperty(source)) {
        const o = {};
        o[source] = this.poseTarget.template.props[source];
        val = this.propsToThreeObjects(o)[target];
      }

      // Mirror
      if (val && !this.poseWeightOnLeft && val.isQuaternion) {
        val.x *= -1;
        val.w *= -1;
      }

      return val;
    }
  }

  mirrorPose(p) {
    const r = {};
    for (let [key, val] of Object.entries(p)) {
      // Create a mirror image
      if (val.isQuaternion) {
        if (key.startsWith("Left")) {
          key = "Right" + key.substring(4);
        } else if (key.startsWith("Right")) {
          key = "Left" + key.substring(5);
        }
        val.x *= -1;
        val.w *= -1;
      }

      r[key] = val.clone();

      // Custom properties
      r[key].t = val.t;
      r[key].d = val.d;
    }
    return r;
  }

  poseFactory(template, ms = 2000) {
    // Pose object
    const o = {
      template: template,
      props: this.propsToThreeObjects(template.props),
    };

    for (const [p, val] of Object.entries(o.props)) {
      // Restrain movement when standing
      if (
        this.opt.modelMovementFactor < 1 &&
        template.standing &&
        (p === "Hips.quaternion" || p === "Spine.quaternion" || p === "Spine1.quaternion" || p === "Spine2.quaternion" || p === "Neck.quaternion" || p === "LeftUpLeg.quaternion" || p === "LeftLeg.quaternion" || p === "RightUpLeg.quaternion" || p === "RightLeg.quaternion")
      ) {
        const ref = this.poseStraight[p];
        const angle = val.angleTo(ref);
        val.rotateTowards(ref, (1 - this.opt.modelMovementFactor) * angle);
      }

      // Custom properties
      val.t = this.animClock; // timestamp
      val.d = ms; // Transition duration
    }
    return o;
  }

  setPoseFromTemplate(template, ms = 2000) {
    // Special cases
    const isIntermediate = template && this.poseTarget && this.poseTarget.template && ((this.poseTarget.template.standing && template.lying) || (this.poseTarget.template.lying && template.standing));
    const isSameTemplate = template && template === this.poseCurrentTemplate;
    const isWeightOnLeft = this.poseWeightOnLeft;
    let duration = isIntermediate ? 1000 : ms;

    // New pose template
    if (isIntermediate) {
      this.poseCurrentTemplate = this.poseTemplates["oneknee"];
      setTimeout(() => {
        this.setPoseFromTemplate(template, ms);
      }, duration);
    } else {
      this.poseCurrentTemplate = template || this.poseCurrentTemplate;
    }

    // Set target
    this.poseTarget = this.poseFactory(this.poseCurrentTemplate, duration);
    this.poseWeightOnLeft = true;

    // Mirror properties, if necessary
    if ((!isSameTemplate && !isWeightOnLeft) || (isSameTemplate && isWeightOnLeft)) {
      this.poseTarget.props = this.mirrorPose(this.poseTarget.props);
      this.poseWeightOnLeft = !this.poseWeightOnLeft;
    }

    // Gestures
    if (this.gesture) {
      for (let [p, val] of Object.entries(this.gesture)) {
        if (this.poseTarget.props.hasOwnProperty(p)) {
          this.poseTarget.props[p].copy(val);
          this.poseTarget.props[p].t = val.t;
          this.poseTarget.props[p].d = val.d;
        }
      }
    }

    // Make sure deltas are included in the target
    Object.keys(this.poseDelta.props).forEach(key => {
      if (!this.poseTarget.props.hasOwnProperty(key)) {
        this.poseTarget.props[key] = this.poseBase.props[key].clone();
        this.poseTarget.props[key].t = this.animClock;
        this.poseTarget.props[key].d = duration;
      }
    });
  }

  getValue(mt) {
    return this.mtAvatar[mt]?.value;
  }

  setValue(mt, val, ms = null) {
    if (this.mtAvatar.hasOwnProperty(mt)) {
      Object.assign(this.mtAvatar[mt], { system: val, systemd: ms, needsUpdate: true });
    }
  }

  getMoodNames() {
    return Object.keys(this.animMoods);
  }

  getMood() {
    return this.opt.avatarMood;
  }

  setMood(s) {
    s = (s || "").trim().toLowerCase();
    if (!this.animMoods.hasOwnProperty(s)) throw new Error("Unknown mood.");
    this.moodName = s;
    this.mood = this.animMoods[this.moodName];

    // Reset morph target baseline
    for (let mt of Object.keys(this.mtAvatar)) {
      let val = this.mtBaselineExceptions.hasOwnProperty(mt) ? this.mtBaselineExceptions[mt] : this.mtBaselineDefault;
      if (this.mood.baseline.hasOwnProperty(mt)) {
        val = this.mood.baseline[mt];
      } else if (this.avatar.baseline?.hasOwnProperty(mt)) {
        val = this.avatar.baseline[mt];
      }
      this.setBaselineValue(mt, val);
    }

    // Set/replace animations
    this.mood.anims.forEach(x => {
      let i = this.animQueue.findIndex(y => y.template.name === x.name);
      if (i !== -1) {
        this.animQueue.splice(i, 1);
      }
      this.animQueue.push(this.animFactory(x, -1));
    });
  }

  getMorphTargetNames() {
    return ["eyesRotateX", "eyesRotateY", ...Object.keys(this.mtAvatar)].sort();
  }

  getBaselineValue(mt) {
    if (mt === "eyesRotateY") {
      const ll = this.getBaselineValue("eyeLookOutLeft");
      if (ll === undefined) return undefined;
      const lr = this.getBaselineValue("eyeLookInLeft");
      if (lr === undefined) return undefined;
      const rl = this.getBaselineValue("eyeLookOutRight");
      if (rl === undefined) return undefined;
      const rr = this.getBaselineValue("eyeLookInRight");
      if (rr === undefined) return undefined;
      return ll - lr;
    } else if (mt === "eyesRotateX") {
      const d = this.getBaselineValue("eyesLookDown");
      if (d === undefined) return undefined;
      const u = this.getBaselineValue("eyesLookUp");
      if (u === undefined) return undefined;
      return d - u;
    } else {
      return this.mtAvatar[mt]?.baseline;
    }
  }

  setBaselineValue(mt, val) {
    if (mt === "eyesRotateY") {
      this.setBaselineValue("eyeLookOutLeft", val === null ? null : val > 0 ? val : 0);
      this.setBaselineValue("eyeLookInLeft", val === null ? null : val > 0 ? 0 : -val);
      this.setBaselineValue("eyeLookOutRight", val === null ? null : val > 0 ? 0 : -val);
      this.setBaselineValue("eyeLookInRight", val === null ? null : val > 0 ? val : 0);
    } else if (mt === "eyesRotateX") {
      this.setBaselineValue("eyesLookDown", val === null ? null : val > 0 ? val : 0);
      this.setBaselineValue("eyesLookUp", val === null ? null : val > 0 ? 0 : -val);
    } else {
      if (this.mtAvatar.hasOwnProperty(mt)) {
        Object.assign(this.mtAvatar[mt], { base: null, baseline: val, needsUpdate: true });
      }
    }
  }

  getFixedValue(mt) {
    if (mt === "eyesRotateY") {
      const ll = this.getFixedValue("eyeLookOutLeft");
      if (ll === null) return null;
      const lr = this.getFixedValue("eyeLookInLeft");
      if (lr === null) return null;
      const rl = this.getFixedValue("eyeLookOutRight");
      if (rl === null) return null;
      const rr = this.getFixedValue("eyeLookInRight");
      if (rr === null) return null;
      return ll - lr;
    } else if (mt === "eyesRotateX") {
      const d = this.getFixedValue("eyesLookDown");
      if (d === null) return null;
      const u = this.getFixedValue("eyesLookUp");
      if (u === null) return null;
      return d - u;
    } else {
      return this.mtAvatar[mt]?.fixed;
    }
  }

  setFixedValue(mt, val, ms = null) {
    if (mt === "eyesRotateY") {
      this.setFixedValue("eyeLookOutLeft", val === null ? null : val > 0 ? val : 0, ms);
      this.setFixedValue("eyeLookInLeft", val === null ? null : val > 0 ? 0 : -val, ms);
      this.setFixedValue("eyeLookOutRight", val === null ? null : val > 0 ? 0 : -val, ms);
      this.setFixedValue("eyeLookInRight", val === null ? null : val > 0 ? val : 0, ms);
    } else if (mt === "eyesRotateX") {
      this.setFixedValue("eyesLookDown", val === null ? null : val > 0 ? val : 0, ms);
      this.setFixedValue("eyesLookUp", val === null ? null : val > 0 ? 0 : -val, ms);
    } else {
      if (this.mtAvatar.hasOwnProperty(mt)) {
        Object.assign(this.mtAvatar[mt], { fixed: val, needsUpdate: true });
      }
    }
  }

  animFactory(t, loop = false, scaleTime = 1, scaleValue = 1, noClockOffset = false) {
    const o = { template: t, ts: [0], vs: {} };

    // Follow the hierarchy of objects
    let a = t;
    while (1) {
      if (a.hasOwnProperty(this.stateName)) {
        a = a[this.stateName];
      } else if (a.hasOwnProperty(this.moodName)) {
        a = a[this.moodName];
      } else if (a.hasOwnProperty(this.poseName)) {
        a = a[this.poseName];
      } else if (a.hasOwnProperty(this.viewName)) {
        a = a[this.viewName];
      } else if (this.avatar.body && a.hasOwnProperty(this.avatar.body)) {
        a = a[this.avatar.body];
      } else if (a.hasOwnProperty("alt")) {
        // Go through alternatives with probabilities
        let b = a.alt[0];
        if (a.alt.length > 1) {
          // Flip a coin
          const coin = Math.random();
          let p = 0;
          for (let i = 0; i < a.alt.length; i++) {
            let val = this.valueFn(a.alt[i].p);
            p += val === undefined ? (1 - p) / (a.alt.length - 1 - i) : val;
            if (coin < p) {
              b = a.alt[i];
              break;
            }
          }
        }
        a = b;
      } else {
        break;
      }
    }

    // Time series
    let delay = this.valueFn(a.delay) || 0;
    if (Array.isArray(delay)) {
      delay = this.gaussianRandom(...delay);
    }
    if (a.hasOwnProperty("dt")) {
      a.dt.forEach((x, i) => {
        let val = this.valueFn(x);
        if (Array.isArray(val)) {
          val = this.gaussianRandom(...val);
        }
        o.ts[i + 1] = o.ts[i] + val;
      });
    } else {
      let l = Object.values(a.vs).reduce((acc, val) => (val.length > acc ? val.length : acc), 0);
      o.ts = Array(l + 1).fill(0);
    }
    if (noClockOffset) {
      o.ts = o.ts.map(x => delay + x * scaleTime);
    } else {
      o.ts = o.ts.map(x => this.animClock + delay + x * scaleTime);
    }

    // Values
    for (let [mt, vs] of Object.entries(a.vs)) {
      const base = this.getBaselineValue(mt);
      const vals = vs.map(x => {
        x = this.valueFn(x);
        if (x === null) {
          return null;
        } else if (typeof x === "function") {
          return x;
        } else if (typeof x === "string" || x instanceof String) {
          return x.slice();
        } else if (Array.isArray(x)) {
          if (mt === "gesture") {
            return x.slice();
          } else {
            return (base === undefined ? 0 : base) + scaleValue * this.gaussianRandom(...x);
          }
        } else if (typeof x == "boolean") {
          return x;
        } else if (x instanceof Object && x.constructor === Object) {
          return Object.assign({}, x);
        } else {
          return (base === undefined ? 0 : base) + scaleValue * x;
        }
      });

      if (mt === "eyesRotateY") {
        o.vs["eyeLookOutLeft"] = [null, ...vals.map(x => (x > 0 ? x : 0))];
        o.vs["eyeLookInLeft"] = [null, ...vals.map(x => (x > 0 ? 0 : -x))];
        o.vs["eyeLookOutRight"] = [null, ...vals.map(x => (x > 0 ? 0 : -x))];
        o.vs["eyeLookInRight"] = [null, ...vals.map(x => (x > 0 ? x : 0))];
      } else if (mt === "eyesRotateX") {
        o.vs["eyesLookDown"] = [null, ...vals.map(x => (x > 0 ? x : 0))];
        o.vs["eyesLookUp"] = [null, ...vals.map(x => (x > 0 ? 0 : -x))];
      } else {
        o.vs[mt] = [null, ...vals];
      }
    }
    for (let mt of Object.keys(o.vs)) {
      while (o.vs[mt].length <= o.ts.length) o.vs[mt].push(o.vs[mt][o.vs[mt].length - 1]);
    }

    // Mood
    if (t.hasOwnProperty("mood")) o.mood = this.valueFn(t.mood).slice();

    // Loop
    if (loop) o.loop = loop;

    return o;
  }

  valueAnimationSeq(vstart, vend, tstart, tend, t, fun = null) {
    vstart = this.valueFn(vstart);
    vend = this.valueFn(vend);
    if (t < tstart) t = tstart;
    if (t > tend) t = tend;
    let k = (vend - vstart) / (tend - tstart);
    if (fun) {
      k *= fun((t - tstart) / (tend - tstart));
    }
    return k * t + (vstart - k * tstart);
  }

  gaussianRandom(start, end, skew = 1, samples = 5) {
    let r = 0;
    for (let i = 0; i < samples; i++) r += Math.random();
    return start + Math.pow(r / samples, skew) * (end - start);
  }

  sigmoidFactory(k) {
    function base(t) {
      return 1 / (1 + Math.exp(-k * t)) - 0.5;
    }
    var corr = 0.5 / base(1);
    return function (t) {
      return corr * base(2 * Math.max(Math.min(t, 1), 0) - 1) + 0.5;
    };
  }

  convertRange(value, r1, r2) {
    return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
  }

  animate(t) {
    // Are we running?
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate.bind(this));

    // Delta time
    let dt = t - this.animTimeLast;
    if (dt < this.animFrameDur) return;
    dt = dt / this.animSlowdownRate;
    this.animClock += dt;
    this.animTimeLast = t;

    let i,
      j,
      l,
      k,
      vol = 0;

    // Statistics start
    if (this.stats) {
      this.stats.begin();
    }

    // Listening
    if (this.isListening) {
      // Get input max volume
      this.listeningAnalyzer.getByteFrequencyData(this.volumeFrequencyData);
      for (i = 2, l = 10; i < l; i++) {
        if (this.volumeFrequencyData[i] > vol) {
          vol = this.volumeFrequencyData[i];
        }
      }

      this.listeningVolume = (this.listeningVolume + vol) / 2;
      if (this.listeningActive) {
        this.listeningTimerTotal += dt;
        if (this.listeningVolume < this.listeningSilenceThresholdLevel) {
          this.listeningTimer += dt;
          if (this.listeningTimer > this.listeningSilenceThresholdMs) {
            if (this.listeningOnchange) this.listeningOnchange("stop", this.listeningTimer);
            this.listeningActive = false;
            this.listeningTimer = 0;
            this.listeningTimerTotal = 0;
          }
        } else {
          this.listeningTimer *= 0.5;
        }
        if (this.listeningTimerTotal > this.listeningActiveDurationMax) {
          if (this.listeningOnchange) this.listeningOnchange("maxactive");
          this.listeningTimerTotal = 0;
        }
      } else {
        this.listeningTimerTotal += dt;
        if (this.listeningVolume > this.listeningActiveThresholdLevel) {
          this.listeningTimer += dt;
          if (this.listeningTimer > this.listeningActiveThresholdMs) {
            if (this.listeningOnchange) this.listeningOnchange("start");
            this.listeningActive = true;
            this.listeningTimer = 0;
            this.listeningTimerTotal = 0;
          }
        } else {
          this.listeningTimer *= 0.5;
        }
        if (this.listeningTimerTotal > this.listeningSilenceDurationMax) {
          if (this.listeningOnchange) this.listeningOnchange("maxsilence");
          this.listeningTimerTotal = 0;
        }
      }
    }

    // Speaking
    if (this.isSpeaking) {
      vol = 0;
      this.audioAnalyzerNode.getByteFrequencyData(this.volumeFrequencyData);
      for (i = 2, l = 10; i < l; i++) {
        if (this.volumeFrequencyData[i] > vol) {
          vol = this.volumeFrequencyData[i];
        }
      }
    }

    // Animation loop
    let isEyeContact = null;
    let isHeadMove = null;
    const tasks = [];
    for (i = 0, l = this.animQueue.length; i < l; i++) {
      const x = this.animQueue[i];
      if (this.animClock < x.ts[0]) continue;

      for (j = x.ndx || 0, k = x.ts.length; j < k; j++) {
        if (this.animClock < x.ts[j]) break;

        for (let [mt, vs] of Object.entries(x.vs)) {
          if (this.mtAvatar.hasOwnProperty(mt)) {
            if (vs[j + 1] === null) continue; // Last or unknown target, skip

            // Start value and target
            const m = this.mtAvatar[mt];
            if (vs[j] === null) vs[j] = m.value; // Fill-in start value
            if (j === k - 1) {
              m.newvalue = vs[j];
            } else {
              m.newvalue = vs[j + 1];
              const tdiff = x.ts[j + 1] - x.ts[j];
              let alpha = 1;
              if (tdiff > 0.0001) alpha = (this.animClock - x.ts[j]) / tdiff;
              if (alpha < 1) {
                if (m.easing) alpha = m.easing(alpha);
                m.newvalue = (1 - alpha) * vs[j] + alpha * m.newvalue;
              }
              if (m.ref && m.ref !== x.vs && m.ref.hasOwnProperty(mt)) delete m.ref[mt];
              m.ref = x.vs;
            }

            // Volume effect
            if (vol) {
              switch (mt) {
                case "viseme_aa":
                case "viseme_E":
                case "viseme_I":
                case "viseme_O":
                case "viseme_U":
                  m.newvalue *= 1 + vol / 255 - 0.5;
              }
            }

            // Update
            m.needsUpdate = true;
          } else if (mt === "eyeContact" && vs[j] !== null && isEyeContact !== false) {
            isEyeContact = Boolean(vs[j]);
          } else if (mt === "headMove" && vs[j] !== null && isHeadMove !== false) {
            if (vs[j] === 0) {
              isHeadMove = false;
            } else {
              if (Math.random() < vs[j]) isHeadMove = true;
              vs[j] = null;
            }
          } else if (vs[j] !== null) {
            tasks.push({ mt: mt, val: vs[j] });
            vs[j] = null;
          }
        }
      }

      // If end timeslot, loop or remove the animation, otherwise keep at it
      if (j === k) {
        if (x.hasOwnProperty("mood")) this.setMood(x.mood);
        if (x.loop) {
          k = this.isSpeaking && (x.template.name === "head" || x.template.name === "eyes") ? 4 : 1; // Restrain
          this.animQueue[i] = this.animFactory(x.template, x.loop > 0 ? x.loop - 1 : x.loop, 1, 1 / k);
        } else {
          this.animQueue.splice(i--, 1);
          l--;
        }
      } else {
        x.ndx = j - 1;
      }
    }

    // Tasks
    for (let i = 0, l = tasks.length; i < l; i++) {
      j = tasks[i].val;

      switch (tasks[i].mt) {
        case "speak":
          this.speakText(j);
          break;

        case "subtitles":
          if (this.onSubtitles && typeof this.onSubtitles === "function") {
            this.onSubtitles(j);
          }
          break;

        case "pose":
          this.poseName = j;
          this.setPoseFromTemplate(this.poseTemplates[this.poseName]);
          break;

        case "gesture":
          this.playGesture(...j);
          break;

        case "function":
          if (j && typeof j === "function") {
            j();
          }
          break;

        case "moveto":
          Object.entries(j.props).forEach(y => {
            if (y[1]) {
              this.poseTarget.props[y[0]].copy(y[1]);
            } else {
              this.poseTarget.props[y[0]].copy(this.getPoseTemplateProp(y[0]));
            }
            this.poseTarget.props[y[0]].t = this.animClock;
            this.poseTarget.props[y[0]].d = y[1] && y[1].d ? y[1].d : y.duration || 2000;
          });
          break;

        case "handLeft":
          this.ikSolve(
            {
              iterations: 20,
              root: "LeftShoulder",
              effector: "LeftHandMiddle1",
              links: [
                { link: "LeftHand", minx: -0.5, maxx: 0.5, miny: -1, maxy: 1, minz: -0.5, maxz: 0.5 },
                { link: "LeftForeArm", minx: -0.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -0.5, maxz: 3 },
                { link: "LeftArm", minx: -1.5, maxx: 1.5, miny: 0, maxy: 0, minz: -1, maxz: 3 },
              ],
            },
            j.x ? new THREE.Vector3(j.x, j.y, j.z) : null,
            true,
            j.d,
          );
          break;

        case "handRight":
          this.ikSolve(
            {
              iterations: 20,
              root: "RightShoulder",
              effector: "RightHandMiddle1",
              links: [
                { link: "RightHand", minx: -0.5, maxx: 0.5, miny: -1, maxy: 1, minz: -0.5, maxz: 0.5, maxAngle: 0.1 },
                { link: "RightForeArm", minx: -0.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -3, maxz: 0.5, maxAngle: 0.2 },
                { link: "RightArm", minx: -1.5, maxx: 1.5, miny: 0, maxy: 0, minz: -1, maxz: 3 },
              ],
            },
            j.x ? new THREE.Vector3(j.x, j.y, j.z) : null,
            true,
            j.d,
          );
          break;
      }
    }

    // Eye contact
    if (isEyeContact || isHeadMove) {
      // Get head position
      e.setFromQuaternion(this.poseAvatar.props["Head.quaternion"]);
      e.x = Math.max(-0.9, Math.min(0.9, 2 * e.x - 0.5));
      e.y = Math.max(-0.9, Math.min(0.9, -2.5 * e.y));

      if (isEyeContact) {
        // Object.assign(this.mtAvatar["eyesLookDown"], { system: e.x < 0 ? -e.x : 0, needsUpdate: true });
        // Object.assign(this.mtAvatar["eyesLookUp"], { system: e.x < 0 ? 0 : e.x, needsUpdate: true });
        // Object.assign(this.mtAvatar["eyeLookInLeft"], { system: e.y < 0 ? -e.y : 0, needsUpdate: true });
        // Object.assign(this.mtAvatar["eyeLookOutLeft"], { system: e.y < 0 ? 0 : e.y, needsUpdate: true });
        // Object.assign(this.mtAvatar["eyeLookInRight"], { system: e.y < 0 ? 0 : e.y, needsUpdate: true });
        // Object.assign(this.mtAvatar["eyeLookOutRight"], { system: e.y < 0 ? -e.y : 0, needsUpdate: true });

        // Head move
        if (isHeadMove) {
          i = -this.mtAvatar["bodyRotateY"].value;
          j = this.gaussianRandom(-0.2, 0.2);
          this.animQueue.push(
            this.animFactory({
              name: "headmove",
              dt: [
                [1000, 2000],
                [1000, 2000, 1, 2],
                [1000, 2000],
                [1000, 2000, 1, 2],
              ],
              vs: {
                headRotateY: [i, i, 0],
                headRotateX: [j, j, 0],
                headRotateZ: [-i / 4, -i / 4, 0],
              },
            }),
          );
        }
      } else {
        i = this.mtAvatar["eyeLookInLeft"].value - this.mtAvatar["eyeLookOutLeft"].value;
        j = this.gaussianRandom(-0.2, 0.2);
        this.animQueue.push(
          this.animFactory({
            name: "headmove",
            dt: [
              [1000, 2000],
              [1000, 2000, 1, 2],
              [1000, 2000],
              [1000, 2000, 1, 2],
            ],
            vs: {
              headRotateY: [null, i, i, 0],
              headRotateX: [null, j, j, 0],
              headRotateZ: [null, -i / 4, -i / 4, 0],
              eyeLookInLeft: [null, 0],
              eyeLookOutLeft: [null, 0],
              eyeLookInRight: [null, 0],
              eyeLookOutRight: [null, 0],
              eyeContact: [0],
            },
          }),
        );
      }
    }

    // Make sure we do not overshoot
    if (dt > 2 * this.animFrameDur) dt = 2 * this.animFrameDur;

    // Randomize facial expression by changing baseline
    if (this.viewName !== "full") {
      i = this.mtRandomized[Math.floor(Math.random() * this.mtRandomized.length)];
      j = this.mtAvatar[i];
      if (!j.needsUpdate) {
        Object.assign(j, { base: (this.mood.baseline[i] || 0) + ((1 + vol / 255) * Math.random()) / 5, needsUpdate: true });
      }
    }

    // Animate
    this.updatePoseBase(this.animClock);
    if (this.mixer) {
      this.mixer.update((dt / 1000) * this.mixer.timeScale);
    }
    this.updatePoseDelta();

    // Volume based head movement, set targets
    if ((this.isSpeaking || this.isListening) && isEyeContact) {
      if (vol > this.volumeMax) {
        this.volumeHeadBase = 0.05;
        if (Math.random() > 0.6) {
          this.volumeHeadTarget = -0.05 - Math.random() / 15;
        }
        this.volumeMax = vol;
      } else {
        this.volumeMax *= 0.92;
        this.volumeHeadTarget = this.volumeHeadBase - 0.9 * (this.volumeHeadBase - this.volumeHeadTarget);
      }
    } else {
      this.volumeHeadTarget = 0;
      this.volumeMax = 0;
    }
    i = this.volumeHeadTarget - this.volumeHeadCurrent;
    j = Math.abs(i);
    if (j > 0.0001) {
      k = j * (this.volumeHeadEasing(Math.min(1, (this.volumeHeadVelocity * dt) / 1000 / j) / 2 + 0.5) - 0.5);
      this.volumeHeadCurrent += Math.sign(i) * Math.min(j, k);
    }
    if (Math.abs(this.volumeHeadCurrent) > 0.0001) {
      q.setFromAxisAngle(axisx, this.volumeHeadCurrent);
      this.objectNeck.quaternion.multiply(q);
    }

    // Hip-feet balance
    box.setFromObject(this.armature);
    this.objectLeftToeBase.getWorldPosition(v);
    this.objectRightToeBase.getWorldPosition(w);
    this.objectHips.position.y -= box.min.y / 2;
    this.objectHips.position.x -= (v.x + w.x) / 4;
    this.objectHips.position.z -= (v.z + w.z) / 2;

    // Update Dynamic Bones
    this.dynamicbones.update(dt);

    // Update morph targets
    this.updateMorphTargets(dt);

    // Camera
    if (this.cameraClock !== null && this.cameraClock < 1000) {
      this.cameraClock += dt;
      if (this.cameraClock > 1000) this.cameraClock = 1000;
      let s = new THREE.Spherical().setFromVector3(this.cameraStart);
      let sEnd = new THREE.Spherical().setFromVector3(this.cameraEnd);
      s.phi += this.easing(this.cameraClock / 1000) * (sEnd.phi - s.phi);
      s.theta += this.easing(this.cameraClock / 1000) * (sEnd.theta - s.theta);
      s.radius += this.easing(this.cameraClock / 1000) * (sEnd.radius - s.radius);
      s.makeSafe();
      this.camera.position.setFromSpherical(s);
      if (this.controlsStart.x !== this.controlsEnd.x) {
        this.controls.target.copy(this.controlsStart.lerp(this.controlsEnd, this.easing(this.cameraClock / 1000)));
      } else {
        s.setFromVector3(this.controlsStart);
        sEnd.setFromVector3(this.controlsEnd);
        s.phi += this.easing(this.cameraClock / 1000) * (sEnd.phi - s.phi);
        s.theta += this.easing(this.cameraClock / 1000) * (sEnd.theta - s.theta);
        s.radius += this.easing(this.cameraClock / 1000) * (sEnd.radius - s.radius);
        s.makeSafe();
        this.controls.target.setFromSpherical(s);
      }
      this.controls.update();
    }

    // Autorotate
    if (this.controls.autoRotate) this.controls.update();

    // Statistics end
    if (this.stats) {
      this.stats.end();
    }

    this.render();
  }

  resetLips() {
    this.visemeNames.forEach(x => {
      this.morphs.forEach(y => {
        const ndx = y.morphTargetDictionary["viseme_" + x];
        if (ndx !== undefined) {
          y.morphTargetInfluences[ndx] = 0;
        }
      });
    });
  }

  lipsyncGetProcessor(lang, path = "./") {
    if (!this.lipsync.hasOwnProperty(lang)) {
      const className = "BlessYou" + lang.charAt(0).toUpperCase() + lang.slice(1);
      import(`./blessyou-${lang.toLowerCase()}.mjs`).then(module => {
        this.lipsync[lang] = new module[className]();
      });
    }
  }

  lipsyncPreProcessText(s, lang) {
    const o = this.lipsync[lang] || Object.values(this.lipsync)[0];
    return o.preProcessText(s);
  }

  lipsyncWordsToVisemes(word, lang) {
    const o = this.lipsync[lang] || Object.values(this.lipsync)[0];
    return o.wordsToVisemes(word);
  }

  speakText(s, opt = null, onsubtitles = null, excludes = null) {
    opt = opt || {};

    // Classifiers
    const dividersSentence = /[!\.\?\n\p{Extended_Pictographic}]/gu;
    const dividersWord = /[ ]/gu;
    const speakables = /[\p{L}\p{N},\.\p{Quotation_Mark}!€\$\+\p{Dash_Punctuation}%&\?]/gu;
    const emojis = /[\p{Extended_Pictographic}]/gu;
    const lipsyncLang = opt.lipsyncLang || this.avatar.lipsyncLang || this.opt.lipsyncLang;

    let markdownWord = ""; // markdown word
    let textWord = ""; // text-to-speech word
    let markId = 0; // SSML mark id
    let ttsSentence = []; // Text-to-speech sentence
    let lipsyncAnim = []; // Lip-sync animation sequence
    const letters = [...s];
    for (let i = 0; i < letters.length; i++) {
      const isLast = i === letters.length - 1;
      const isSpeakable = letters[i].match(speakables);
      let isEndOfSentence = letters[i].match(dividersSentence);
      const isEmoji = letters[i].match(emojis);
      const isEndOfWord = letters[i].match(dividersWord);

      // Exception for end-of-sentence is repeated dividers
      if (isEndOfSentence && !isLast && !isEmoji && letters[i + 1].match(dividersSentence)) {
        isEndOfSentence = false;
      }

      // Add letter to subtitles
      if (onsubtitles) {
        markdownWord += letters[i];
      }

      // Add letter to spoken word
      if (isSpeakable) {
        if (!excludes || excludes.every(x => i < x[0] || i > x[1])) {
          textWord += letters[i];
        }
      }

      // Add words to sentence and animations
      if (isEndOfWord || isEndOfSentence || isLast) {
        // Add to text-to-speech sentence
        if (textWord.length) {
          textWord = this.lipsyncPreProcessText(textWord, lipsyncLang);
          if (textWord.length) {
            ttsSentence.push({
              mark: markId,
              word: textWord,
            });
          }
        }

        // Push subtitles to animation queue
        if (markdownWord.length) {
          lipsyncAnim.push({
            mark: markId,
            template: { name: "subtitles" },
            ts: [0],
            vs: {
              subtitles: [markdownWord],
            },
          });
          markdownWord = "";
        }

        // Push visemes to animation queue
        if (textWord.length) {
          const val = this.lipsyncWordsToVisemes(textWord, lipsyncLang);
          if (val && val.visemes && val.visemes.length) {
            const d = val.times[val.visemes.length - 1] + val.durations[val.visemes.length - 1];
            for (let j = 0; j < val.visemes.length; j++) {
              const o = lipsyncAnim.push({
                mark: markId,
                template: { name: "viseme" },
                ts: [(val.times[j] - 0.6) / d, (val.times[j] + 0.5) / d, (val.times[j] + val.durations[j] + 0.5) / d],
                vs: {
                  ["viseme_" + val.visemes[j]]: [null, val.visemes[j] === "PP" || val.visemes[j] === "FF" ? 0.9 : 0.6, 0],
                },
              });
            }
          }
          textWord = "";
          markId++;
        }
      }

      // Process sentences
      if (isEndOfSentence || isLast) {
        // Send sentence to Text-to-speech queue
        if (ttsSentence.length || (isLast && lipsyncAnim.length)) {
          const o = {
            anim: lipsyncAnim,
          };
          if (onsubtitles) o.onSubtitles = onsubtitles;
          if (ttsSentence.length && !opt.avatarMute) {
            o.text = ttsSentence;
            if (opt.avatarMood) o.mood = opt.avatarMood;
            if (opt.ttsLang) o.lang = opt.ttsLang;
            if (opt.ttsVoice) o.voice = opt.ttsVoice;
            if (opt.ttsRate) o.rate = opt.ttsRate;
            if (opt.ttsVoice) o.pitch = opt.ttsPitch;
            if (opt.ttsVolume) o.volume = opt.ttsVolume;
          }
          this.speechQueue.push(o);

          // Reset sentence and animation sequence
          ttsSentence = [];
          textWord = "";
          markId = 0;
          lipsyncAnim = [];
        }

        // Send emoji, if the divider was a known emoji
        if (isEmoji) {
          let emoji = this.animEmojis[letters[i]];
          if (emoji && emoji.link) emoji = this.animEmojis[emoji.link];
          if (emoji) {
            this.speechQueue.push({ emoji: emoji });
          }
        }

        this.speechQueue.push({ break: 100 });
      }
    }

    this.speechQueue.push({ break: 1000 });

    // Start speaking (if not already)
    this.startSpeaking();
  }

  async speakEmoji(em) {
    let emoji = this.animEmojis[em];
    if (emoji && emoji.link) emoji = this.animEmojis[emoji.link];
    if (emoji) {
      this.speechQueue.push({ emoji: emoji });
    }
    this.startSpeaking();
  }

  async speakBreak(t) {
    this.speechQueue.push({ break: t });
    this.startSpeaking();
  }

  async speakMarker(onmarker) {
    this.speechQueue.push({ marker: onmarker });
    this.startSpeaking();
  }

  async playBackgroundAudio(url) {
    // Fetch audio
    let response = await fetch(url);
    let arraybuffer = await response.arrayBuffer();

    // Play audio in a loop
    this.stopBackgroundAudio();
    this.audioBackgroundSource = this.audioCtx.createBufferSource();
    this.audioBackgroundSource.loop = true;
    this.audioBackgroundSource.buffer = await this.audioCtx.decodeAudioData(arraybuffer);
    this.audioBackgroundSource.playbackRate.value = 1 / this.animSlowdownRate;
    this.audioBackgroundSource.connect(this.audioBackgroundGainNode);
    this.audioBackgroundSource.start(0, 100);
  }

  stopBackgroundAudio() {
    try {
      this.audioBackgroundSource.stop();
    } catch (error) {}
    this.audioBackgroundSource.disconnect();
  }

  async setReverb(url = null) {
    if (url) {
      // load impulse response from file
      let response = await fetch(url);
      let arraybuffer = await response.arrayBuffer();
      this.audioReverbNode.buffer = await this.audioCtx.decodeAudioData(arraybuffer);
    } else {
      // dry impulse
      const samplerate = this.audioCtx.sampleRate;
      const impulse = this.audioCtx.createBuffer(2, samplerate, samplerate);
      impulse.getChannelData(0)[0] = 1;
      impulse.getChannelData(1)[0] = 1;
      this.audioReverbNode.buffer = impulse;
    }
  }

  setMixerGain(speech, background = null, fadeSecs = 0) {
    if (speech !== null) {
      this.audioSpeechGainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
      if (fadeSecs) {
        this.audioSpeechGainNode.gain.setValueAtTime(Math.max(this.audioSpeechGainNode.gain.value, 0.0001), this.audioCtx.currentTime);
        this.audioSpeechGainNode.gain.exponentialRampToValueAtTime(Math.max(speech, 0.0001), this.audioCtx.currentTime + fadeSecs);
      } else {
        this.audioSpeechGainNode.gain.setValueAtTime(speech, this.audioCtx.currentTime);
      }
    }
    if (background !== null) {
      this.audioBackgroundGainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
      if (fadeSecs) {
        this.audioBackgroundGainNode.gain.setValueAtTime(Math.max(this.audioBackgroundGainNode.gain.value, 0.0001), this.audioCtx.currentTime);
        this.audioBackgroundGainNode.gain.exponentialRampToValueAtTime(Math.max(background, 0.0001), this.audioCtx.currentTime + fadeSecs);
      } else {
        this.audioBackgroundGainNode.gain.setValueAtTime(background, this.audioCtx.currentTime);
      }
    }
  }

  speakAudio(r, opt = null, onsubtitles = null) {
    opt = opt || {};
    const lipsyncLang = opt.lipsyncLang || this.avatar.lipsyncLang || this.opt.lipsyncLang;
    const o = {};

    if (r.words) {
      let lipsyncAnim = [];
      for (let i = 0; i < r.words.length; i++) {
        const word = r.words[i];
        const time = r.wtimes[i];
        let duration = r.wdurations[i];

        if (word.length) {
          // Subtitle
          if (onsubtitles) {
            lipsyncAnim.push({
              template: { name: "subtitles" },
              ts: [time],
              vs: {
                subtitles: [" " + word],
              },
            });
          }

          // If visemes were not specified, calculate visemes based on the words
          if (!r.visemes) {
            const wrd = this.lipsyncPreProcessText(word, lipsyncLang);
            const val = this.lipsyncWordsToVisemes(wrd, lipsyncLang);
            if (val && val.visemes && val.visemes.length) {
              const dTotal = val.times[val.visemes.length - 1] + val.durations[val.visemes.length - 1];
              const overdrive = Math.min(duration, Math.max(0, duration - val.visemes.length * 150));
              let level = 0.6 + this.convertRange(overdrive, [0, duration], [0, 0.4]);
              duration = Math.min(duration, val.visemes.length * 200);
              if (dTotal > 0) {
                for (let j = 0; j < val.visemes.length; j++) {
                  const t = time + (val.times[j] / dTotal) * duration;
                  const d = (val.durations[j] / dTotal) * duration;
                  lipsyncAnim.push({
                    template: { name: "viseme" },
                    ts: [t - Math.min(60, (2 * d) / 3), t + Math.min(25, d / 2), t + d + Math.min(60, d / 2)],
                    vs: {
                      ["viseme_" + val.visemes[j]]: [null, val.visemes[j] === "PP" || val.visemes[j] === "FF" ? 0.9 : level, 0],
                    },
                  });
                }
              }
            }
          }
        }
      }

      // If visemes were specified, use them
      if (r.visemes) {
        for (let i = 0; i < r.visemes.length; i++) {
          const viseme = r.visemes[i];
          const time = r.vtimes[i];
          const duration = r.vdurations[i];
          lipsyncAnim.push({
            template: { name: "viseme" },
            ts: [time - (2 * duration) / 3, time + duration / 2, time + duration + duration / 2],
            vs: {
              ["viseme_" + viseme]: [null, viseme === "PP" || viseme === "FF" ? 0.9 : 0.6, 0],
            },
          });
        }
      }

      // Timed marker callbacks
      if (r.markers) {
        for (let i = 0; i < r.markers.length; i++) {
          const fn = r.markers[i];
          const time = r.mtimes[i];
          lipsyncAnim.push({
            template: { name: "markers" },
            ts: [time],
            vs: { function: [fn] },
          });
        }
      }

      if (lipsyncAnim.length) {
        o.anim = lipsyncAnim;
      }
    }

    if (r.audio) {
      o.audio = r.audio;
    }

    // Blend shapes animation
    if (r.anim?.name) {
      let animObj = this.animFactory(r.anim, false, 1, 1, true);
      if (!o.anim) {
        o.anim = [animObj];
      } else {
        o.anim.push(animObj);
      }
    }

    if (onsubtitles) {
      o.onSubtitles = onsubtitles;
    }

    if (Object.keys(o).length) {
      this.speechQueue.push(o);
      this.speechQueue.push({ break: 300 });
      this.startSpeaking();
    }
  }

  async playAudio(force = false) {
    if (!this.armature || (this.isAudioPlaying && !force)) return;
    this.isAudioPlaying = true;
    if (this.audioPlaylist.length) {
      const item = this.audioPlaylist.shift();

      // If Web Audio API is suspended, try to resume it
      if (this.audioCtx.state === "suspended" || this.audioCtx.state === "interrupted") {
        const resume = this.audioCtx.resume();
        const timeout = new Promise((_r, rej) => setTimeout(() => rej("p2"), 1000));
        try {
          await Promise.race([resume, timeout]);
        } catch (e) {
          console.error("Can't play audio. Web Audio API suspended. This is often due to calling some speak method before the first user action, which is typically prevented by the browser.");
          this.playAudio(true);
          return;
        }
      }

      // AudioBuffer
      let audio;
      if (Array.isArray(item.audio)) {
        // Convert from PCM samples
        let buf = this.concatArrayBuffers(item.audio);
        audio = this.pcmToAudioBuffer(buf);
      } else {
        audio = item.audio;
      }

      // Create audio source
      this.audioSpeechSource = this.audioCtx.createBufferSource();
      this.audioSpeechSource.buffer = audio;
      this.audioSpeechSource.playbackRate.value = 1 / this.animSlowdownRate;
      this.audioSpeechSource.connect(this.audioAnalyzerNode);
      this.audioSpeechSource.addEventListener(
        "ended",
        () => {
          this.audioSpeechSource.disconnect();
          this.playAudio(true);
        },
        { once: true },
      );

      // Rescale lipsync and push to queue
      let delay = 0;
      if (item.anim) {
        // Find the lowest negative time point, if any
        delay = Math.abs(Math.min(0, ...item.anim.map(x => Math.min(...x.ts))));
        item.anim.forEach(x => {
          for (let i = 0; i < x.ts.length; i++) {
            x.ts[i] = this.animClock + x.ts[i] + delay;
          }
          this.animQueue.push(x);
        });
      }

      // Play, dealy in seconds so pre-animations can be played
      this.audioSpeechSource.start(delay / 1000);
    } else {
      this.isAudioPlaying = false;
      this.startSpeaking(true);
    }
  }

  async startSpeaking(force = false) {
    if (!this.armature || (this.isSpeaking && !force)) return;
    this.stateName = "speaking";
    this.isSpeaking = true;
    if (this.speechQueue.length) {
      let line = this.speechQueue.shift();
      if (line.emoji) {
        // Look at the camera
        this.lookAtCamera(500);

        // Only emoji
        let duration = line.emoji.dt.reduce((a, b) => a + b, 0);
        this.animQueue.push(this.animFactory(line.emoji));
        setTimeout(this.startSpeaking.bind(this), duration, true);
      } else if (line.break) {
        // Break
        setTimeout(this.startSpeaking.bind(this), line.break, true);
      } else if (line.audio) {
        // Look at the camera
        this.lookAtCamera(500);
        this.speakWithHands();

        // Make a playlist
        this.audioPlaylist.push({ anim: line.anim, audio: line.audio });
        this.onSubtitles = line.onSubtitles || null;
        this.resetLips();
        if (line.mood) this.setMood(line.mood);
        this.playAudio();
      } else if (line.text) {
        // Look at the camera
        this.lookAtCamera(500);

        // Spoken text
        try {
          // Convert text to SSML
          let ssml = "<speak>";
          line.text.forEach((x, i) => {
            // Add mark
            if (i > 0) {
              ssml += " <mark name='" + x.mark + "'/>";
            }

            // Add word
            ssml += x.word
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replaceAll('"', "&quot;")
              .replaceAll("'", "&apos;")
              .replace(/^\p{Dash_Punctuation}$/gu, '<break time="750ms"/>');
          });
          ssml += "</speak>";

          const o = {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
              input: {
                ssml: ssml,
              },
              voice: {
                languageCode: line.lang || this.avatar.ttsLang || this.opt.ttsLang,
                name: line.voice || this.avatar.ttsVoice || this.opt.ttsVoice,
              },
              audioConfig: {
                audioEncoding: this.ttsAudioEncoding,
                speakingRate: (line.rate || this.avatar.ttsRate || this.opt.ttsRate) + this.mood.speech.deltaRate,
                pitch: (line.pitch || this.avatar.ttsPitch || this.opt.ttsPitch) + this.mood.speech.deltaPitch,
                volumeGainDb: (line.volume || this.avatar.ttsVolume || this.opt.ttsVolume) + this.mood.speech.deltaVolume,
              },
              enableTimePointing: [1], // Timepoint information for mark tags
            }),
          };

          // JSON Web Token
          if (this.opt.jwtGet && typeof this.opt.jwtGet === "function") {
            o.headers["Authorization"] = "Bearer " + (await this.opt.jwtGet());
          }

          const res = await fetch(this.opt.ttsEndpoint + (this.opt.ttsApikey ? "?key=" + this.opt.ttsApikey : ""), o);
          const data = await res.json();

          if (res.status === 200 && data && data.audioContent) {
            // Audio data
            const buf = this.b64ToArrayBuffer(data.audioContent);
            const audio = await this.audioCtx.decodeAudioData(buf);
            this.speakWithHands();

            // Workaround for Google TTS not providing all timepoints
            const times = [0];
            let markIndex = 0;
            line.text.forEach((x, i) => {
              if (i > 0) {
                let ms = times[times.length - 1];
                if (data.timepoints[markIndex]) {
                  ms = data.timepoints[markIndex].timeSeconds * 1000;
                  if (data.timepoints[markIndex].markName === "" + x.mark) {
                    markIndex++;
                  }
                }
                times.push(ms);
              }
            });

            // Word-to-audio alignment
            const timepoints = [{ mark: 0, time: 0 }];
            times.forEach((x, i) => {
              if (i > 0) {
                let prevDuration = x - times[i - 1];
                if (prevDuration > 150) prevDuration - 150; // Trim out leading space
                timepoints[i - 1].duration = prevDuration;
                timepoints.push({ mark: i, time: x });
              }
            });
            let d = 1000 * audio.duration; // Duration in ms
            if (d > this.opt.ttsTrimEnd) d = d - this.opt.ttsTrimEnd; // Trim out silence at the end
            timepoints[timepoints.length - 1].duration = d - timepoints[timepoints.length - 1].time;

            // Re-set animation starting times and rescale durations
            line.anim.forEach(x => {
              const timepoint = timepoints[x.mark];
              if (timepoint) {
                for (let i = 0; i < x.ts.length; i++) {
                  x.ts[i] = timepoint.time + x.ts[i] * timepoint.duration + this.opt.ttsTrimStart;
                }
              }
            });

            // Add to the playlist
            this.audioPlaylist.push({ anim: line.anim, audio: audio });
            this.onSubtitles = line.onSubtitles || null;
            this.resetLips();
            if (line.mood) this.setMood(line.mood);
            this.playAudio();
          } else {
            this.startSpeaking(true);
          }
        } catch (error) {
          console.error("Error:", error);
          this.startSpeaking(true);
        }
      } else if (line.anim) {
        // Only subtitles
        this.onSubtitles = line.onSubtitles || null;
        this.resetLips();
        if (line.mood) this.setMood(line.mood);
        line.anim.forEach((x, i) => {
          for (let j = 0; j < x.ts.length; j++) {
            x.ts[j] = this.animClock + 10 * i;
          }
          this.animQueue.push(x);
        });
        setTimeout(this.startSpeaking.bind(this), 10 * line.anim.length, true);
      } else if (line.marker) {
        if (typeof line.marker === "function") {
          line.marker();
        }
        this.startSpeaking(true);
      } else {
        this.startSpeaking(true);
      }
    } else {
      this.stateName = "idle";
      this.isSpeaking = false;
    }
  }

  pauseSpeaking() {
    try {
      this.audioSpeechSource.stop();
    } catch (error) {}
    this.audioPlaylist.length = 0;
    this.stateName = "idle";
    this.isSpeaking = false;
    this.isAudioPlaying = false;
    this.animQueue = this.animQueue.filter(x => x.template.name !== "viseme" && x.template.name !== "subtitles" && x.template.name !== "blendshapes");
    if (this.armature) {
      this.resetLips();
      this.render();
    }
  }

  stopSpeaking() {
    try {
      this.audioSpeechSource.stop();
    } catch (error) {}
    this.audioPlaylist.length = 0;
    this.speechQueue.length = 0;
    this.animQueue = this.animQueue.filter(x => x.template.name !== "viseme" && x.template.name !== "subtitles" && x.template.name !== "blendshapes");
    this.stateName = "idle";
    this.isSpeaking = false;
    this.isAudioPlaying = false;
    if (this.armature) {
      this.resetLips();
      this.render();
    }
  }

  async streamStart(opt = {}, onAudioStart = null, onAudioEnd = null, onSubtitles = null) {
    this.stopSpeaking(); // Stop the speech queue mode

    this.isStreaming = true;
    this.isSpeaking = true;
    this.stateName = "speaking";
    this.streamAudioStartTime = 0;
    this.streamLipsyncQueue = [];
    this.streamLipsyncType = opt.lipsyncType || this.streamLipsyncType || "visemes";
    this.streamLipsyncLang = opt.lipsyncLang || this.streamLipsyncLang || this.avatar.lipsyncLang || this.opt.lipsyncLang;

    if (opt.sampleRate !== undefined) {
      const sr = opt.sampleRate;
      if (typeof sr === "number" && sr >= 8000 && sr <= 96000) {
        if (sr !== this.audioCtx.sampleRate) {
          this.initAudioGraph(sr);
        }
      } else {
        console.warn("Invalid sampleRate provided. It must be a number between 8000 and 96000 Hz.");
      }
    }

    if (opt.gain !== undefined) {
      this.audioStreamGainNode.gain.value = opt.gain;
    }

    if (!this.workletLoaded) {
      try {
        const loadPromise = this.audioCtx.audioWorklet.addModule(workletUrl.href);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Worklet loading timed out")), 5000));
        await Promise.race([loadPromise, timeoutPromise]);
        this.workletLoaded = true;
      } catch (error) {
        console.error("Failed to load audio worklet:", error);
        throw new Error("Failed to initialize streaming speech");
      }
    }

    // Create and connect worklet node
    this.streamWorkletNode = new AudioWorkletNode(this.audioCtx, "playback-worklet");

    // Connect worklet through stream gain node for volume control
    this.streamWorkletNode.connect(this.audioStreamGainNode);
    this.streamWorkletNode.connect(this.audioAnalyzerNode);

    this.streamWorkletNode.port.onmessage = event => {
      if (event.data.type === "playback-started") {
        this.streamAudioStartTime = this.animClock;
        this._processStreamLipsyncQueue();
        this.speakWithHands();
        if (onAudioStart) onAudioStart();
      }

      if (event.data.type === "playback-ended") {
        this.streamStop();
        if (onAudioEnd) onAudioEnd();
      }
    };

    this.resetLips();
    this.lookAtCamera(500);
    opt.mood && this.setMood(opt.mood);
    this.onSubtitles = onSubtitles || null;

    // If Web Audio API is suspended, try to resume it
    if (this.audioCtx.state === "suspended" || this.audioCtx.state === "interrupted") {
      const resume = this.audioCtx.resume();
      const timeout = new Promise((_r, rej) => setTimeout(() => rej("p2"), 1000));
      try {
        await Promise.race([resume, timeout]);
      } catch (e) {
        console.error("Can't play audio. Web Audio API suspended. This is often due to calling some speak method before the first user action, which is typically prevented by the browser.");
        return;
      }
    }
  }

  streamNotifyEnd() {
    if (!this.isStreaming || !this.streamWorkletNode) return;

    this.streamWorkletNode.port.postMessage({ type: "no-more-data" });
  }

  streamStop() {
    if (this.streamWorkletNode) {
      try {
        this.streamWorkletNode.disconnect();
      } catch (e) {
        console.error("Error disconnecting streamWorkletNode:", e);
        /* ignore */
      }
      this.streamWorkletNode = null;
    }
    this.isStreaming = false;
    this.isSpeaking = false;
    this.stateName = "idle";
    this.streamAudioStartTime = 0;
    if (this.armature) {
      this.resetLips();
      this.render();
    }
  }

  _processStreamLipsyncQueue() {
    // console.log(`[TalkingHead] Processing ${this.streamLipsyncQueue.length} queued lipsync items.`);
    while (this.streamLipsyncQueue.length > 0) {
      const lipsyncPayload = this.streamLipsyncQueue.shift();
      // Pass the now confirmed streamAudioStartTime
      this._processLipsyncData(lipsyncPayload, this.streamAudioStartTime);
    }
  }

  _processLipsyncData(r, audioStart) {
    // Process visemes
    if (r.visemes && this.streamLipsyncType == "visemes") {
      for (let i = 0; i < r.visemes.length; i++) {
        const viseme = r.visemes[i];
        const time = audioStart + r.vtimes[i];
        const duration = r.vdurations[i];
        const animObj = {
          template: { name: "viseme" },
          ts: [time - (2 * duration) / 3, time + duration / 2, time + duration + duration / 2],
          vs: {
            ["viseme_" + viseme]: [null, viseme === "PP" || viseme === "FF" ? 0.9 : 0.6, 0],
          },
        };
        this.animQueue.push(animObj);
      }
    }

    // Process words
    if (r.words && (this.onSubtitles || this.streamLipsyncType == "words")) {
      for (let i = 0; i < r.words.length; i++) {
        const word = r.words[i];
        const time = r.wtimes[i];
        let duration = r.wdurations[i];

        if (word.length) {
          // If subtitles callback is available, add the subtitles
          if (this.onSubtitles) {
            this.animQueue.push({
              template: { name: "subtitles" },
              ts: [audioStart + time],
              vs: {
                subtitles: [" " + word],
              },
            });
          }

          // Calculate visemes based on the words
          if (this.streamLipsyncType == "words") {
            const lipsyncLang = this.streamLipsyncLang || this.avatar.lipsyncLang || this.opt.lipsyncLang;
            const wrd = this.lipsyncPreProcessText(word, lipsyncLang);
            const val = this.lipsyncWordsToVisemes(wrd, lipsyncLang);
            if (val && val.visemes && val.visemes.length) {
              const dTotal = val.times[val.visemes.length - 1] + val.durations[val.visemes.length - 1];
              const overdrive = Math.min(duration, Math.max(0, duration - val.visemes.length * 150));
              let level = 0.6 + this.convertRange(overdrive, [0, duration], [0, 0.4]);
              duration = Math.min(duration, val.visemes.length * 200);
              if (dTotal > 0) {
                for (let j = 0; j < val.visemes.length; j++) {
                  const t = audioStart + time + (val.times[j] / dTotal) * duration;
                  const d = (val.durations[j] / dTotal) * duration;
                  this.animQueue.push({
                    template: { name: "viseme" },
                    ts: [t - Math.min(60, (2 * d) / 3), t + Math.min(25, d / 2), t + d + Math.min(60, d / 2)],
                    vs: {
                      ["viseme_" + val.visemes[j]]: [null, val.visemes[j] === "PP" || val.visemes[j] === "FF" ? 0.9 : level, 0],
                    },
                  });
                }
              }
            }
          }
        }
      }
    }

    // If blendshapes anims are provided, add them to animQueue
    if (r.anims && this.streamLipsyncType == "blendshapes") {
      for (let i = 0; i < r.anims.length; i++) {
        let anim = r.anims[i];
        anim.delay += audioStart;
        let animObj = this.animFactory(anim, false, 1, 1, true);
        this.animQueue.push(animObj);
      }
    }
  }

  streamAudio(r) {
    if (!this.isStreaming || !this.streamWorkletNode) return;

    if (r.audio instanceof ArrayBuffer) {
      this.streamWorkletNode.port.postMessage(r.audio, [r.audio]);
    } else if (r.audio instanceof Int16Array) {
      // Fallback: r.audio is an Int16Array
      this.streamWorkletNode.port.postMessage(r.audio); // No transfer list, so it gets cloned
    } else {
      console.error("r.audio is not an ArrayBuffer or Int16Array. Cannot process audio of this type:", r.audio);
    }

    if (r.visemes || r.anims || r.words) {
      if (!this.streamAudioStartTime) {
        // Lipsync data received before audio playback start. Queue the lipsync data.
        this.streamLipsyncQueue.push(r);
        return;
      }
      this._processLipsyncData(r, this.streamAudioStartTime);
    }
  }

  makeEyeContact(t) {
    this.animQueue.push(
      this.animFactory({
        name: "eyecontact",
        dt: [0, t],
        vs: { eyeContact: [1] },
      }),
    );
  }

  lookAhead(t) {
    if (t) {
      // Randomize head/eyes ratio
      let drotx = (Math.random() - 0.5) / 4;
      let droty = (Math.random() - 0.5) / 4;

      // Remove old, if any
      let old = this.animQueue.findIndex(y => y.template.name === "lookat");
      if (old !== -1) {
        this.animQueue.splice(old, 1);
      }

      // Add new anim
      const templateLookAt = {
        name: "lookat",
        dt: [750, t],
        vs: {
          bodyRotateX: [drotx],
          bodyRotateY: [droty],
          eyesRotateX: [-3 * drotx + 0.1],
          eyesRotateY: [-5 * droty],
          browInnerUp: [[0, 0.7]],
          mouthLeft: [[0, 0.7]],
          mouthRight: [[0, 0.7]],
          eyeContact: [0],
          headMove: [0],
        },
      };
      this.animQueue.push(this.animFactory(templateLookAt));
    }
  }

  lookAtCamera(t) {
    if (this.avatar.hasOwnProperty("avatarIgnoreCamera")) {
      if (this.avatar.avatarIgnoreCamera) {
        this.lookAhead(t);
      } else {
        this.lookAt(null, null, t);
      }
    } else if (this.opt.avatarIgnoreCamera) {
      this.lookAhead(t);
    } else {
      this.lookAt(null, null, t);
    }
  }

  lookAt(x, y, t) {
    // Eyes position
    const rect = this.nodeAvatar.getBoundingClientRect();
    this.objectLeftEye.updateMatrixWorld(true);
    this.objectRightEye.updateMatrixWorld(true);
    const plEye = new THREE.Vector3().setFromMatrixPosition(this.objectLeftEye.matrixWorld);
    const prEye = new THREE.Vector3().setFromMatrixPosition(this.objectRightEye.matrixWorld);
    const pEyes = new THREE.Vector3().addVectors(plEye, prEye).divideScalar(2);

    pEyes.project(this.camera);
    let eyesx = ((pEyes.x + 1) / 2) * rect.width + rect.left;
    let eyesy = (-(pEyes.y - 1) / 2) * rect.height + rect.top;

    // if coordinate not specified, look at the camera
    if (x === null) x = eyesx;
    if (y === null) y = eyesy;

    // Use body/camera rotation to determine the required head rotation
    q.copy(this.poseTarget.props["Hips.quaternion"]);
    q.multiply(this.poseTarget.props["Spine.quaternion"]);
    q.multiply(this.poseTarget.props["Spine1.quaternion"]);
    q.multiply(this.poseTarget.props["Spine2.quaternion"]);
    q.multiply(this.poseTarget.props["Neck.quaternion"]);
    q.multiply(this.poseTarget.props["Head.quaternion"]);
    e.setFromQuaternion(q);
    let rx = e.x / (40 / 24); // Refer to setValue(bodyRotateX)
    let ry = e.y / (9 / 4); // Refer to setValue(bodyRotateY)
    let camerarx = Math.min(0.4, Math.max(-0.4, this.camera.rotation.x));
    let camerary = Math.min(0.4, Math.max(-0.4, this.camera.rotation.y));

    // Calculate new delta
    let maxx = Math.max(window.innerWidth - eyesx, eyesx);
    let maxy = Math.max(window.innerHeight - eyesy, eyesy);
    let rotx = this.convertRange(y, [eyesy - maxy, eyesy + maxy], [-0.3, 0.6]) - rx + camerarx;
    let roty = this.convertRange(x, [eyesx - maxx, eyesx + maxx], [-0.8, 0.8]) - ry + camerary;
    rotx = Math.min(0.6, Math.max(-0.3, rotx));
    roty = Math.min(0.8, Math.max(-0.8, roty));

    // Randomize head/eyes ratio
    let drotx = (Math.random() - 0.5) / 4;
    let droty = (Math.random() - 0.5) / 4;

    if (t) {
      // Remove old, if any
      let old = this.animQueue.findIndex(y => y.template.name === "lookat");
      if (old !== -1) {
        this.animQueue.splice(old, 1);
      }

      // Add new anim
      const templateLookAt = {
        name: "lookat",
        dt: [750, t],
        vs: {
          bodyRotateX: [rotx + drotx],
          bodyRotateY: [roty + droty],
          eyesRotateX: [-3 * drotx + 0.1],
          eyesRotateY: [-5 * droty],
          browInnerUp: [[0, 0.7]],
          mouthLeft: [[0, 0.7]],
          mouthRight: [[0, 0.7]],
          eyeContact: [0],
          headMove: [0],
        },
      };
      this.animQueue.push(this.animFactory(templateLookAt));
    }
  }

  touchAt(x, y) {
    const rect = this.nodeAvatar.getBoundingClientRect();
    const pointer = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, this.camera);
    const intersects = raycaster.intersectObject(this.armature);
    if (intersects.length > 0) {
      const target = intersects[0].point;
      const LeftArmPos = new THREE.Vector3();
      const RightArmPos = new THREE.Vector3();
      this.objectLeftArm.getWorldPosition(LeftArmPos);
      this.objectRightArm.getWorldPosition(RightArmPos);
      const LeftD2 = LeftArmPos.distanceToSquared(target);
      const RightD2 = RightArmPos.distanceToSquared(target);
      if (LeftD2 < RightD2) {
        this.ikSolve(
          {
            iterations: 20,
            root: "LeftShoulder",
            effector: "LeftHandMiddle1",
            links: [
              { link: "LeftHand", minx: -0.5, maxx: 0.5, miny: -1, maxy: 1, minz: -0.5, maxz: 0.5, maxAngle: 0.1 },
              { link: "LeftForeArm", minx: -0.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -0.5, maxz: 3, maxAngle: 0.2 },
              { link: "LeftArm", minx: -1.5, maxx: 1.5, miny: 0, maxy: 0, minz: -1, maxz: 3 },
            ],
          },
          target,
          false,
          1000,
        );
        this.setValue("handFistLeft", 0);
      } else {
        this.ikSolve(
          {
            iterations: 20,
            root: "RightShoulder",
            effector: "RightHandMiddle1",
            links: [
              { link: "RightHand", minx: -0.5, maxx: 0.5, miny: -1, maxy: 1, minz: -0.5, maxz: 0.5, maxAngle: 0.1 },
              { link: "RightForeArm", minx: -0.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -3, maxz: 0.5, maxAngle: 0.2 },
              { link: "RightArm", minx: -1.5, maxx: 1.5, miny: 0, maxy: 0, minz: -1, maxz: 3 },
            ],
          },
          target,
          false,
          1000,
        );
        this.setValue("handFistRight", 0);
      }
    } else {
      ["LeftArm", "LeftForeArm", "LeftHand", "RightArm", "RightForeArm", "RightHand"].forEach(x => {
        let key = x + ".quaternion";
        this.poseTarget.props[key].copy(this.getPoseTemplateProp(key));
        this.poseTarget.props[key].t = this.animClock;
        this.poseTarget.props[key].d = 1000;
      });
    }

    return intersects.length > 0;
  }

  speakWithHands(delay = 0, prob = 0.5) {
    // Only if we are standing and not bending and probabilities match up
    if (this.mixer || this.gesture || !this.poseTarget.template.standing || this.poseTarget.template.bend || Math.random() > prob) return;

    // Random targets for left hand
    this.ikSolve(
      {
        root: "LeftShoulder",
        effector: "LeftHandMiddle1",
        links: [
          { link: "LeftHand", minx: -0.5, maxx: 0.5, miny: -1, maxy: 1, minz: -0.5, maxz: 0.5 },
          { link: "LeftForeArm", minx: -0.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -0.5, maxz: 3 },
          { link: "LeftArm", minx: -1.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -1, maxz: 3 },
        ],
      },
      new THREE.Vector3(this.gaussianRandom(0, 0.5), this.gaussianRandom(-0.8, -0.2), this.gaussianRandom(0, 0.5)),
      true,
    );

    // Random target for right hand
    this.ikSolve(
      {
        root: "RightShoulder",
        effector: "RightHandMiddle1",
        links: [{ link: "RightHand", minx: -0.5, maxx: 0.5, miny: -1, maxy: 1, minz: -0.5, maxz: 0.5 }, { link: "RightForeArm", minx: -0.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -3, maxz: 0.5 }, { link: "RightArm" }],
      },
      new THREE.Vector3(this.gaussianRandom(-0.5, 0), this.gaussianRandom(-0.8, -0.2), this.gaussianRandom(0, 0.5)),
      true,
    );

    // Moveto
    const dt = [];
    const moveto = [];

    // First move
    dt.push(100 + Math.round(Math.random() * 500));
    moveto.push({
      duration: 1000,
      props: {
        "LeftHand.quaternion": new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -1 - Math.random(), 0)),
        "RightHand.quaternion": new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1 + Math.random(), 0)),
      },
    });
    ["LeftArm", "LeftForeArm", "RightArm", "RightForeArm"].forEach(x => {
      moveto[0].props[x + ".quaternion"] = this.ikMesh.getObjectByName(x).quaternion.clone();
    });

    // Return to original target
    dt.push(1000 + Math.round(Math.random() * 500));
    moveto.push({ duration: 2000, props: {} });
    ["LeftArm", "LeftForeArm", "RightArm", "RightForeArm", "LeftHand", "RightHand"].forEach(x => {
      moveto[1].props[x + ".quaternion"] = null;
    });

    // Make an animation
    const anim = this.animFactory({
      name: "talkinghands",
      delay: delay,
      dt: dt,
      vs: { moveto: moveto },
    });
    this.animQueue.push(anim);
  }

  getSlowdownRate(k) {
    return this.animSlowdownRate;
  }

  setSlowdownRate(k) {
    this.animSlowdownRate = k;
    this.audioSpeechSource.playbackRate.value = 1 / this.animSlowdownRate;
    this.audioBackgroundSource.playbackRate.value = 1 / this.animSlowdownRate;
  }

  getAutoRotateSpeed(k) {
    return this.controls.autoRotateSpeed;
  }

  setAutoRotateSpeed(speed) {
    this.controls.autoRotateSpeed = speed;
    this.controls.autoRotate = speed > 0;
  }

  start() {
    if (this.armature && this.isRunning === false) {
      this.audioCtx.resume();
      this.animTimeLast = performance.now();
      this.isRunning = true;
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  stop() {
    this.isRunning = false;
    this.audioCtx.suspend();
  }

  startListening(analyzer, opt = {}, onchange = null) {
    this.listeningAnalyzer = analyzer;
    this.listeningAnalyzer.fftSize = 256;
    this.listeningAnalyzer.smoothingTimeConstant = 0.1;
    this.listeningAnalyzer.minDecibels = -70;
    this.listeningAnalyzer.maxDecibels = -10;
    this.listeningOnchange = onchange && typeof onchange === "function" ? onchange : null;

    this.listeningSilenceThresholdLevel = opt?.hasOwnProperty("listeningSilenceThresholdLevel") ? opt.listeningSilenceThresholdLevel : this.opt.listeningSilenceThresholdLevel;
    this.listeningSilenceThresholdMs = opt?.hasOwnProperty("listeningSilenceThresholdMs") ? opt.listeningSilenceThresholdMs : this.opt.listeningSilenceThresholdMs;
    this.listeningSilenceDurationMax = opt?.hasOwnProperty("listeningSilenceDurationMax") ? opt.listeningSilenceDurationMax : this.opt.listeningSilenceDurationMax;
    this.listeningActiveThresholdLevel = opt?.hasOwnProperty("listeningActiveThresholdLevel") ? opt.listeningActiveThresholdLevel : this.opt.listeningActiveThresholdLevel;
    this.listeningActiveThresholdMs = opt?.hasOwnProperty("listeningActiveThresholdMs") ? opt.listeningActiveThresholdMs : this.opt.listeningActiveThresholdMs;
    this.listeningActiveDurationMax = opt?.hasOwnProperty("listeningActiveDurationMax") ? opt.listeningActiveDurationMax : this.opt.listeningActiveDurationMax;

    this.listeningActive = false;
    this.listeningVolume = 0;
    this.listeningTimer = 0;
    this.listeningTimerTotal = 0;
    this.isListening = true;
  }

  stopListening() {
    this.isListening = false;
  }

  async playAnimation(url, onprogress = null, dur = 10, ndx = 0, scale = 0.01) {
    if (!this.armature) return;

    let item = this.animClips.find(x => x.url === url + "-" + ndx);
    if (item) {
      // Reset pose update
      let anim = this.animQueue.find(x => x.template.name === "pose");
      if (anim) {
        anim.ts[0] = Infinity;
      }

      // Set new pose
      Object.entries(item.pose.props).forEach(x => {
        this.poseBase.props[x[0]] = x[1].clone();
        this.poseTarget.props[x[0]] = x[1].clone();
        this.poseTarget.props[x[0]].t = 0;
        this.poseTarget.props[x[0]].d = 1000;
      });

      // Create a new mixer
      this.mixer = new THREE.AnimationMixer(this.armature);
      this.mixer.addEventListener("finished", this.stopAnimation.bind(this), { once: true });

      // Play action
      const repeat = Math.ceil(dur / item.clip.duration);
      const action = this.mixer.clipAction(item.clip);
      action.setLoop(THREE.LoopRepeat, repeat);
      action.clampWhenFinished = true;
      action.fadeIn(0.5).play();
    } else {
      // Load animation
      const loader = new FBXLoader();

      let fbx = await loader.loadAsync(url, onprogress);

      if (fbx && fbx.animations && fbx.animations[ndx]) {
        let anim = fbx.animations[ndx];

        // Rename and scale Mixamo tracks, create a pose
        const props = {};
        anim.tracks.forEach(t => {
          t.name = t.name.replaceAll("mixamorig", "");
          const ids = t.name.split(".");
          if (ids[1] === "position") {
            for (let i = 0; i < t.values.length; i++) {
              t.values[i] = t.values[i] * scale;
            }
            props[t.name] = new THREE.Vector3(t.values[0], t.values[1], t.values[2]);
          } else if (ids[1] === "quaternion") {
            props[t.name] = new THREE.Quaternion(t.values[0], t.values[1], t.values[2], t.values[3]);
          } else if (ids[1] === "rotation") {
            props[ids[0] + ".quaternion"] = new THREE.Quaternion().setFromEuler(new THREE.Euler(t.values[0], t.values[1], t.values[2], "XYZ")).normalize();
          }
        });

        // Add to clips
        const newPose = { props: props };
        if (props["Hips.position"]) {
          if (props["Hips.position"].y < 0.5) {
            newPose.lying = true;
          } else {
            newPose.standing = true;
          }
        }
        this.animClips.push({
          url: url + "-" + ndx,
          clip: anim,
          pose: newPose,
        });

        // Play
        this.playAnimation(url, onprogress, dur, ndx, scale);
      } else {
        const msg = "Animation " + url + " (ndx=" + ndx + ") not found";
        console.error(msg);
      }
    }
  }

  stopAnimation() {
    // Stop mixer
    this.mixer = null;

    // Restart gesture
    if (this.gesture) {
      for (let [p, v] of Object.entries(this.gesture)) {
        v.t = this.animClock;
        v.d = 1000;
        if (this.poseTarget.props.hasOwnProperty(p)) {
          this.poseTarget.props[p].copy(v);
          this.poseTarget.props[p].t = this.animClock;
          this.poseTarget.props[p].d = 1000;
        }
      }
    }

    // Restart pose animation
    let anim = this.animQueue.find(x => x.template.name === "pose");
    if (anim) {
      anim.ts[0] = this.animClock;
    }
    this.setPoseFromTemplate(null);
  }

  async playPose(url, onprogress = null, dur = 5, ndx = 0, scale = 0.01) {
    if (!this.armature) return;

    // Check if we already have the pose template ready
    let pose = this.playAnimation[url];
    if (!pose) {
      const item = this.animPoses.find(x => x.url === url + "-" + ndx);
      if (item) {
        pose = item.pose;
      }
    }

    // If we have the template, use it, otherwise try to load it
    if (pose) {
      this.poseName = url;

      this.mixer = null;
      let anim = this.animQueue.find(x => x.template.name === "pose");
      if (anim) {
        anim.ts[0] = this.animClock + dur * 1000 + 2000;
      }
      this.setPoseFromTemplate(pose);
    } else {
      // Load animation
      const loader = new FBXLoader();

      let fbx = await loader.loadAsync(url, onprogress);

      if (fbx && fbx.animations && fbx.animations[ndx]) {
        let anim = fbx.animations[ndx];

        // Create a pose
        const props = {};
        anim.tracks.forEach(t => {
          // Rename and scale Mixamo tracks
          t.name = t.name.replaceAll("mixamorig", "");
          const ids = t.name.split(".");
          if (ids[1] === "position") {
            props[t.name] = new THREE.Vector3(t.values[0] * scale, t.values[1] * scale, t.values[2] * scale);
          } else if (ids[1] === "quaternion") {
            props[t.name] = new THREE.Quaternion(t.values[0], t.values[1], t.values[2], t.values[3]);
          } else if (ids[1] === "rotation") {
            props[ids[0] + ".quaternion"] = new THREE.Quaternion().setFromEuler(new THREE.Euler(t.values[0], t.values[1], t.values[2], "XYZ")).normalize();
          }
        });

        // Add to pose
        const newPose = { props: props };
        if (props["Hips.position"]) {
          if (props["Hips.position"].y < 0.5) {
            newPose.lying = true;
          } else {
            newPose.standing = true;
          }
        }
        this.animPoses.push({
          url: url + "-" + ndx,
          pose: newPose,
        });

        // Play
        this.playPose(url, onprogress, dur, ndx, scale);
      } else {
        const msg = "Pose " + url + " (ndx=" + ndx + ") not found";
        console.error(msg);
      }
    }
  }

  stopPose() {
    this.stopAnimation();
  }

  playGesture(name, dur = 3, mirror = false, ms = 1000) {
    if (!this.armature) return;

    // Hand gesture, if any
    let g = this.gestureTemplates[name];
    if (g) {
      // New gesture always overrides the existing one
      if (this.gestureTimeout) {
        clearTimeout(this.gestureTimeout);
        this.gestureTimeout = null;
      }

      // Stop talking hands animation
      let ndx = this.animQueue.findIndex(y => y.template.name === "talkinghands");
      if (ndx !== -1) {
        this.animQueue[ndx].ts = this.animQueue[ndx].ts.map(x => 0);
      }

      // Set gesture
      this.gesture = this.propsToThreeObjects(g);
      if (mirror) {
        this.gesture = this.mirrorPose(this.gesture);
      }
      if (name === "namaste" && this.avatar.body === "M") {
        // Work-a-round for male model so that the hands meet
        this.gesture["RightArm.quaternion"].rotateTowards(new THREE.Quaternion(0, 1, 0, 0), -0.25);
        this.gesture["LeftArm.quaternion"].rotateTowards(new THREE.Quaternion(0, 1, 0, 0), -0.25);
      }

      // Apply to target
      for (let [p, val] of Object.entries(this.gesture)) {
        val.t = this.animClock;
        val.d = ms;
        if (this.poseTarget.props.hasOwnProperty(p)) {
          this.poseTarget.props[p].copy(val);
          this.poseTarget.props[p].t = this.animClock;
          this.poseTarget.props[p].d = ms;
        }
      }

      // Timer
      if (dur && Number.isFinite(dur)) {
        this.gestureTimeout = setTimeout(this.stopGesture.bind(this, ms), 1000 * dur);
      }
    }

    // Animated emoji, if any
    let em = this.animEmojis[name];
    if (em) {
      // Follow link
      if (em && em.link) {
        em = this.animEmojis[em.link];
      }

      if (em) {
        // Look at the camera for 500 ms
        this.lookAtCamera(500);

        // Create animation and tag as gesture
        const anim = this.animFactory(em);
        anim.gesture = true;

        // Rescale duration
        if (dur && Number.isFinite(dur)) {
          const first = anim.ts[0];
          const last = anim.ts[anim.ts.length - 1];
          const total = last - first;
          const excess = dur * 1000 - total;

          // If longer, increase longer parts; if shorter, scale everything
          if (excess > 0) {
            const dt = [];
            for (let i = 1; i < anim.ts.length; i++) dt.push(anim.ts[i] - anim.ts[i - 1]);
            const rescale = em.template?.rescale || dt.map(x => x / total);
            const excess = dur * 1000 - total;
            anim.ts = anim.ts.map((x, i, arr) => {
              return i === 0 ? first : arr[i - 1] + dt[i - 1] + rescale[i - 1] * excess;
            });
          } else {
            const scale = (dur * 1000) / total;
            anim.ts = anim.ts.map(x => first + scale * (x - first));
          }
        }

        this.animQueue.push(anim);
      }
    }
  }

  stopGesture(ms = 1000) {
    // Stop gesture timer
    if (this.gestureTimeout) {
      clearTimeout(this.gestureTimeout);
      this.gestureTimeout = null;
    }

    // Stop hand gesture, if any
    if (this.gesture) {
      const gs = Object.entries(this.gesture);
      this.gesture = null;
      for (const [p, val] of gs) {
        if (this.poseTarget.props.hasOwnProperty(p)) {
          this.poseTarget.props[p].copy(this.getPoseTemplateProp(p));
          this.poseTarget.props[p].t = this.animClock;
          this.poseTarget.props[p].d = ms;
        }
      }
    }

    // Stop animated emoji gesture, if any
    let i = this.animQueue.findIndex(y => y.gesture);
    if (i !== -1) {
      this.animQueue.splice(i, 1);
    }
  }

  ikSolve(ik, target = null, relative = false, d = null) {
    const targetVec = new THREE.Vector3();
    const effectorPos = new THREE.Vector3();
    const effectorVec = new THREE.Vector3();
    const linkPos = new THREE.Vector3();
    const invLinkQ = new THREE.Quaternion();
    const linkScale = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const vector = new THREE.Vector3();

    // Reset IK setup positions and rotations
    const root = this.ikMesh.getObjectByName(ik.root);
    root.position.setFromMatrixPosition(this.armature.getObjectByName(ik.root).matrixWorld);
    root.quaternion.setFromRotationMatrix(this.armature.getObjectByName(ik.root).matrixWorld);
    if (target && relative) {
      target.add(root.position);
    }
    const effector = this.ikMesh.getObjectByName(ik.effector);
    const links = ik.links;
    links.forEach(x => {
      x.bone = this.ikMesh.getObjectByName(x.link);
      x.bone.quaternion.copy(this.getPoseTemplateProp(x.link + ".quaternion"));
    });
    root.updateMatrixWorld(true);
    const iterations = ik.iterations || 10;

    // Iterate
    if (target) {
      for (let i = 0; i < iterations; i++) {
        let rotated = false;
        for (let j = 0, jl = links.length; j < jl; j++) {
          const bone = links[j].bone;
          bone.matrixWorld.decompose(linkPos, invLinkQ, linkScale);
          invLinkQ.invert();
          effectorPos.setFromMatrixPosition(effector.matrixWorld);
          effectorVec.subVectors(effectorPos, linkPos);
          effectorVec.applyQuaternion(invLinkQ);
          effectorVec.normalize();
          targetVec.subVectors(target, linkPos);
          targetVec.applyQuaternion(invLinkQ);
          targetVec.normalize();
          let angle = targetVec.dot(effectorVec);
          if (angle > 1.0) {
            angle = 1.0;
          } else if (angle < -1.0) {
            angle = -1.0;
          }
          angle = Math.acos(angle);
          if (angle < 1e-5) continue;
          if (links[j].minAngle !== undefined && angle < links[j].minAngle) {
            angle = links[j].minAngle;
          }
          if (links[j].maxAngle !== undefined && angle > links[j].maxAngle) {
            angle = links[j].maxAngle;
          }
          axis.crossVectors(effectorVec, targetVec);
          axis.normalize();
          q.setFromAxisAngle(axis, angle);
          bone.quaternion.multiply(q);

          // Constraints
          bone.rotation.setFromVector3(
            vector
              .setFromEuler(bone.rotation)
              .clamp(
                new THREE.Vector3(links[j].minx !== undefined ? links[j].minx : -Infinity, links[j].miny !== undefined ? links[j].miny : -Infinity, links[j].minz !== undefined ? links[j].minz : -Infinity),
                new THREE.Vector3(links[j].maxx !== undefined ? links[j].maxx : Infinity, links[j].maxy !== undefined ? links[j].maxy : Infinity, links[j].maxz !== undefined ? links[j].maxz : Infinity),
              ),
          );

          bone.updateMatrixWorld(true);
          rotated = true;
        }
        if (!rotated) break;
      }
    }

    // Apply
    if (d) {
      links.forEach(x => {
        this.poseTarget.props[x.link + ".quaternion"].copy(x.bone.quaternion);
        this.poseTarget.props[x.link + ".quaternion"].t = this.animClock;
        this.poseTarget.props[x.link + ".quaternion"].d = d;
      });
    }
  }
}

export { TalkingHead };
