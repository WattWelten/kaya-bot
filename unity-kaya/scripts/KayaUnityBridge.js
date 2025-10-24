// Unity WebGL Bridge für KAYA Avatar
var KayaUnityBridge = {
    // Unity Instance
    unityInstance: null,
    
    // Initialize Unity
    initialize: function(unityInstance) {
        this.unityInstance = unityInstance;
        console.log('KAYA Unity Bridge initialized');
    },
    
    // Set Avatar Emotion
    setEmotion: function(emotion) {
        if (this.unityInstance) {
            this.unityInstance.SendMessage('KayaAvatar', 'SetEmotionFromJS', emotion);
        }
    },
    
    // Set Speaking State
    setSpeaking: function(isSpeaking) {
        if (this.unityInstance) {
            this.unityInstance.SendMessage('KayaAvatar', 'SetSpeakingFromJS', isSpeaking.toString());
        }
    },
    
    // Set Lip Sync Intensity
    setLipSync: function(intensity) {
        if (this.unityInstance) {
            this.unityInstance.SendMessage('KayaAvatar', 'SetLipSyncFromJS', intensity.toString());
        }
    },
    
    // Send Message to Frontend
    sendToFrontend: function(message) {
        // Send to React frontend
        if (window.ReactUnityBridge) {
            window.ReactUnityBridge.handleUnityMessage(message);
        }
    },
    
    // Log to Console
    logToConsole: function(message) {
        console.log('[Unity KAYA]:', message);
    }
};

// Unity WebGL Functions (called from Unity)
function SendToFrontend(message) {
    KayaUnityBridge.sendToFrontend(message);
}

function LogToConsole(message) {
    KayaUnityBridge.logToConsole(message);
}

// Export for global access
window.KayaUnityBridge = KayaUnityBridge;

