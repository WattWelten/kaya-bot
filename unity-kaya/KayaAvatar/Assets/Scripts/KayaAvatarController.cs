using UnityEngine;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System;

[System.Serializable]
public class EmotionData
{
    [Header("Emotion Settings")]
    public string emotionName;
    public Material emotionMaterial;
    public AnimationClip emotionAnimation;
    public float intensity = 1.0f;
    public Color emotionColor = Color.white;
    
    [Header("Blend Shape Settings")]
    public int[] blendShapeIndices;
    public float[] blendShapeWeights;
}

[System.Serializable]
public class GestureData
{
    [Header("Gesture Settings")]
    public string gestureName;
    public AnimationClip gestureAnimation;
    public float duration = 1.0f;
    public bool loop = false;
    public int priority = 0;
}

[System.Serializable]
public class LipSyncData
{
    [Header("Lip Sync Settings")]
    public int[] mouthBlendShapes;
    public int[] tongueBlendShapes;
    public float sensitivity = 1.0f;
    public float smoothing = 0.1f;
}

public class KayaAvatarController : MonoBehaviour
{
    [Header("🎭 Avatar Components")]
    [Tooltip("Haupt-Avatar Animator")]
    public Animator avatarAnimator;
    
    [Tooltip("Avatar Mesh Renderer")]
    public SkinnedMeshRenderer avatarRenderer;
    
    [Tooltip("Gesichts-Mesh für Blend Shapes")]
    public SkinnedMeshRenderer faceRenderer;
    
    [Header("🎨 Emotion System")]
    [Tooltip("Emotionen-Konfiguration")]
    public EmotionData[] emotions;
    
    [Tooltip("Aktuelle Emotion")]
    public string currentEmotion = "Neutral";
    
    [Header("🎬 Animation System")]
    [Tooltip("Gesten-Konfiguration")]
    public GestureData[] gestures;
    
    [Tooltip("Idle Animation")]
    public AnimationClip idleAnimation;
    
    [Tooltip("Speaking Animation")]
    public AnimationClip speakingAnimation;
    
    [Header("🗣️ Lip Sync System")]
    [Tooltip("Lip-Sync-Konfiguration")]
    public LipSyncData lipSyncData;
    
    [Tooltip("Audio Source für TTS")]
    public AudioSource audioSource;
    
    [Tooltip("Lip-Sync aktiviert")]
    public bool lipSyncEnabled = true;
    
    [Header("⚡ Performance Settings")]
    [Tooltip("LOD Level")]
    [Range(0, 3)]
    public int lodLevel = 0;
    
    [Tooltip("Update Rate (Hz)")]
    [Range(10, 60)]
    public int updateRate = 30;
    
    [Tooltip("Culling Distance")]
    public float cullingDistance = 100f;
    
    [Header("🔧 Debug Settings")]
    [Tooltip("Debug-Modus aktiviert")]
    public bool debugMode = false;
    
    [Tooltip("Console-Logging aktiviert")]
    public bool enableLogging = true;
    
    // Private Variables
    private Emotion currentEmotionState = Emotion.Neutral;
    private bool isSpeaking = false;
    private float speakingIntensity = 0f;
    private float lastUpdateTime = 0f;
    private Dictionary<string, EmotionData> emotionDict;
    private Dictionary<string, GestureData> gestureDict;
    
    // WebGL Communication
    [DllImport("__Internal")]
    private static extern void SendToFrontend(string message);
    
    [DllImport("__Internal")]
    private static extern void LogToConsole(string message);
    
    public enum Emotion
    {
        Neutral, Happy, Sad, Angry, Surprised, 
        Confused, Listening, Speaking, Excited, Calm
    }
    
    void Start()
    {
        InitializeAvatar();
        SetupDictionaries();
        SetEmotion(Emotion.Neutral);
        
        if (enableLogging)
            LogToConsole("KAYA Avatar initialized successfully");
    }
    
    void Update()
    {
        // Performance-optimierte Updates
        if (Time.time - lastUpdateTime < 1f / updateRate)
            return;
            
        lastUpdateTime = Time.time;
        
        // Lip-Sync Update
        if (lipSyncEnabled && isSpeaking)
        {
            UpdateLipSync();
        }
        
        // LOD Update
        UpdateLOD();
    }
    
    private void InitializeAvatar()
    {
        // Avatar-Komponenten validieren
        if (avatarAnimator == null)
            avatarAnimator = GetComponent<Animator>();
            
        if (avatarRenderer == null)
            avatarRenderer = GetComponent<SkinnedMeshRenderer>();
            
        if (faceRenderer == null)
            faceRenderer = avatarRenderer; // Fallback
        
        if (audioSource == null)
            audioSource = GetComponent<AudioSource>();
        
        // Initiale Animation
        if (idleAnimation != null && avatarAnimator != null)
        {
            avatarAnimator.Play(idleAnimation.name);
        }
    }
    
    private void SetupDictionaries()
    {
        emotionDict = new Dictionary<string, EmotionData>();
        gestureDict = new Dictionary<string, GestureData>();
        
        foreach (var emotion in emotions)
        {
            emotionDict[emotion.emotionName] = emotion;
        }
        
        foreach (var gesture in gestures)
        {
            gestureDict[gesture.gestureName] = gesture;
        }
    }
    
    // Public Methods für JavaScript
    public void SetEmotionFromJS(string emotionName)
    {
        if (System.Enum.TryParse(emotionName, out Emotion emotion))
        {
            SetEmotion(emotion);
        }
        else if (emotionDict.ContainsKey(emotionName))
        {
            SetCustomEmotion(emotionName);
        }
    }
    
    public void SetSpeakingFromJS(string speaking)
    {
        isSpeaking = bool.Parse(speaking);
        if (isSpeaking)
        {
            SetEmotion(Emotion.Speaking);
        }
        else
        {
            SetEmotion(Emotion.Neutral);
        }
    }
    
    public void SetLipSyncFromJS(string intensity)
    {
        speakingIntensity = Mathf.Clamp01(float.Parse(intensity));
    }
    
    public void PlayGestureFromJS(string gestureName)
    {
        PlayGesture(gestureName);
    }
    
    // Internal Methods
    private void SetEmotion(Emotion emotion)
    {
        currentEmotionState = emotion;
        currentEmotion = emotion.ToString();
        
        // Material ändern
        if (emotionDict.ContainsKey(currentEmotion))
        {
            var emotionData = emotionDict[currentEmotion];
            if (emotionData.emotionMaterial != null)
            {
                avatarRenderer.material = emotionData.emotionMaterial;
            }
        }
        
        // Animation abspielen
        if (avatarAnimator != null)
        {
            switch (emotion)
            {
                case Emotion.Speaking:
                    if (speakingAnimation != null)
                        avatarAnimator.Play(speakingAnimation.name);
                    break;
                default:
                    if (idleAnimation != null)
                        avatarAnimator.Play(idleAnimation.name);
                    break;
            }
        }
        
        // Blend Shapes anwenden
        ApplyEmotionBlendShapes(emotion);
        
        if (enableLogging)
            LogToConsole($"Emotion changed to: {emotion}");
    }
    
    private void SetCustomEmotion(string emotionName)
    {
        if (emotionDict.ContainsKey(emotionName))
        {
            var emotionData = emotionDict[emotionName];
            currentEmotion = emotionName;
            
            // Material
            if (emotionData.emotionMaterial != null)
            {
                avatarRenderer.material = emotionData.emotionMaterial;
            }
            
            // Animation
            if (emotionData.emotionAnimation != null && avatarAnimator != null)
            {
                avatarAnimator.Play(emotionData.emotionAnimation.name);
            }
            
            // Blend Shapes
            ApplyCustomEmotionBlendShapes(emotionData);
        }
    }
    
    private void ApplyEmotionBlendShapes(Emotion emotion)
    {
        if (faceRenderer == null) return;
        
        // Standard-Emotionen Blend Shapes
        switch (emotion)
        {
            case Emotion.Happy:
                SetBlendShape(0, 100f); // Lächeln
                SetBlendShape(1, 50f);  // Augen
                break;
            case Emotion.Sad:
                SetBlendShape(2, 100f); // Traurig
                SetBlendShape(3, 50f);  // Augenbrauen
                break;
            case Emotion.Angry:
                SetBlendShape(4, 100f); // Verärgert
                SetBlendShape(5, 80f);  // Stirn
                break;
            case Emotion.Surprised:
                SetBlendShape(6, 100f); // Überrascht
                SetBlendShape(7, 80f);  // Augen
                break;
            default:
                ResetBlendShapes();
                break;
        }
    }
    
    private void ApplyCustomEmotionBlendShapes(EmotionData emotionData)
    {
        if (faceRenderer == null || emotionData.blendShapeIndices == null) return;
        
        for (int i = 0; i < emotionData.blendShapeIndices.Length; i++)
        {
            if (i < emotionData.blendShapeWeights.Length)
            {
                SetBlendShape(emotionData.blendShapeIndices[i], 
                             emotionData.blendShapeWeights[i] * 100f);
            }
        }
    }
    
    private void SetBlendShape(int index, float weight)
    {
        if (faceRenderer != null && index < faceRenderer.sharedMesh.blendShapeCount)
        {
            faceRenderer.SetBlendShapeWeight(index, weight);
        }
    }
    
    private void ResetBlendShapes()
    {
        if (faceRenderer == null) return;
        
        for (int i = 0; i < faceRenderer.sharedMesh.blendShapeCount; i++)
        {
            faceRenderer.SetBlendShapeWeight(i, 0f);
        }
    }
    
    private void UpdateLipSync()
    {
        if (faceRenderer == null || lipSyncData.mouthBlendShapes == null) return;
        
        // Einfache Lip-Sync-Simulation
        float lipValue = Mathf.Sin(Time.time * 10f) * speakingIntensity;
        
        foreach (int blendShapeIndex in lipSyncData.mouthBlendShapes)
        {
            SetBlendShape(blendShapeIndex, lipValue * 100f);
        }
    }
    
    private void PlayGesture(string gestureName)
    {
        if (gestureDict.ContainsKey(gestureName) && avatarAnimator != null)
        {
            var gesture = gestureDict[gestureName];
            avatarAnimator.Play(gesture.gestureAnimation.name);
            
            if (enableLogging)
                LogToConsole($"Playing gesture: {gestureName}");
        }
    }
    
    private void UpdateLOD()
    {
        // Einfache LOD-Implementierung
        float distance = Vector3.Distance(transform.position, Camera.main.transform.position);
        
        if (distance > cullingDistance)
        {
            avatarRenderer.enabled = false;
        }
        else
        {
            avatarRenderer.enabled = true;
        }
    }
    
    // Public API für Frontend
    public void SendMessageToFrontend(string message)
    {
        SendToFrontend(message);
    }
    
    public void OnAvatarClick()
    {
        SendToFrontend("avatar_clicked");
        PlayGesture("wave");
    }
    
    // Debug Methods
    [ContextMenu("Test Happy Emotion")]
    private void TestHappyEmotion()
    {
        SetEmotion(Emotion.Happy);
    }
    
    [ContextMenu("Test Speaking")]
    private void TestSpeaking()
    {
        SetSpeakingFromJS("true");
    }
    
    [ContextMenu("Reset Avatar")]
    private void ResetAvatar()
    {
        SetEmotion(Emotion.Neutral);
        ResetBlendShapes();
    }
}