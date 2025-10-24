using UnityEngine;
using System.Collections.Generic;
using System.Linq;

[System.Serializable]
public class LipSyncBlendShapeData
{
    [Header("🗣️ Lip Sync Blend Shapes")]
    [Tooltip("Mund-Öffnung Blend Shapes")]
    public int[] mouthOpenShapes;
    
    [Tooltip("Mund-Breite Blend Shapes")]
    public int[] mouthWidthShapes;
    
    [Tooltip("Lippen-Blend Shapes")]
    public int[] lipShapes;
    
    [Tooltip("Zungen-Blend Shapes")]
    public int[] tongueShapes;
    
    [Tooltip("Kiefer-Blend Shapes")]
    public int[] jawShapes;
    
    [Header("🎵 Audio Analysis")]
    [Tooltip("Audio-Sensitivity")]
    [Range(0.1f, 2.0f)]
    public float audioSensitivity = 1.0f;
    
    [Tooltip("Smoothing Factor")]
    [Range(0.0f, 1.0f)]
    public float smoothing = 0.1f;
    
    [Tooltip("Min Threshold")]
    [Range(0.0f, 1.0f)]
    public float minThreshold = 0.1f;
    
    [Tooltip("Max Threshold")]
    [Range(0.0f, 1.0f)]
    public float maxThreshold = 0.9f;
    
    [Header("🎭 Emotion Modifiers")]
    [Tooltip("Emotion-basierte Modifikatoren")]
    public EmotionLipSyncModifier[] emotionModifiers;
    
    [Header("🔧 Advanced Settings")]
    [Tooltip("Real-time Audio Analysis")]
    public bool realTimeAudioAnalysis = true;
    
    [Tooltip("Frequency Range für Mund-Bewegungen")]
    public Vector2 frequencyRange = new Vector2(200, 800);
    
    [Tooltip("Update Rate (Hz)")]
    [Range(10, 60)]
    public int updateRate = 30;
}

[System.Serializable]
public class EmotionLipSyncModifier
{
    [Tooltip("Emotion Name")]
    public string emotionName;
    
    [Tooltip("Mund-Öffnung Multiplier")]
    [Range(0.1f, 2.0f)]
    public float mouthOpenMultiplier = 1.0f;
    
    [Tooltip("Mund-Breite Multiplier")]
    [Range(0.1f, 2.0f)]
    public float mouthWidthMultiplier = 1.0f;
    
    [Tooltip("Lippen Multiplier")]
    [Range(0.1f, 2.0f)]
    public float lipMultiplier = 1.0f;
}

public class AdvancedLipSyncController : MonoBehaviour
{
    [Header("🎤 Audio Input")]
    [Tooltip("Audio Source für TTS")]
    public AudioSource audioSource;
    
    [Tooltip("Microphone Input")]
    public AudioSource microphoneSource;
    
    [Tooltip("Lip-Sync-Konfiguration")]
    public LipSyncBlendShapeData lipSyncData;
    
    [Header("🎭 Avatar Components")]
    [Tooltip("Skinned Mesh Renderer")]
    public SkinnedMeshRenderer faceRenderer;
    
    [Tooltip("Avatar Controller")]
    public KayaAvatarController avatarController;
    
    [Header("🔧 Real-time Settings")]
    [Tooltip("Aktuelle Emotion")]
    public string currentEmotion = "Neutral";
    
    [Tooltip("Sprechen-Status")]
    public bool isSpeaking = false;
    
    [Tooltip("Audio-Level")]
    [Range(0f, 1f)]
    public float audioLevel = 0f;
    
    [Tooltip("Debug-Modus")]
    public bool debugMode = false;
    
    // Private Variables
    private float[] audioSpectrum = new float[1024];
    private float[] smoothedValues;
    private float lastUpdateTime = 0f;
    private Dictionary<string, EmotionLipSyncModifier> emotionModifiers;
    private EmotionLipSyncModifier currentModifier;
    
    // WebGL Communication
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void SendToFrontend(string message);
    
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void LogToConsole(string message);
    
    void Start()
    {
        InitializeLipSync();
        SetupEmotionModifiers();
        SetupAudioAnalysis();
    }
    
    void Update()
    {
        // Performance-optimierte Updates
        if (Time.time - lastUpdateTime < 1f / lipSyncData.updateRate)
            return;
            
        lastUpdateTime = Time.time;
        
        if (isSpeaking && lipSyncData.realTimeAudioAnalysis)
        {
            AnalyzeAudio();
            UpdateLipSync();
        }
        else if (isSpeaking)
        {
            // Fallback: Sinus-basierte Animation
            UpdateLipSyncFallback();
        }
        else
        {
            ResetLipSync();
        }
    }
    
    private void InitializeLipSync()
    {
        // Face Renderer finden
        if (faceRenderer == null)
        {
            faceRenderer = GetComponent<SkinnedMeshRenderer>();
        }
        
        // Avatar Controller finden
        if (avatarController == null)
        {
            avatarController = GetComponent<KayaAvatarController>();
        }
        
        // Audio Source konfigurieren
        if (audioSource == null)
        {
            audioSource = GetComponent<AudioSource>();
        }
        
        if (audioSource != null)
        {
            audioSource.loop = false;
            audioSource.playOnAwake = false;
        }
        
        // Smoothed Values initialisieren
        int maxBlendShapes = 0;
        if (faceRenderer != null && faceRenderer.sharedMesh != null)
        {
            maxBlendShapes = faceRenderer.sharedMesh.blendShapeCount;
        }
        
        smoothedValues = new float[maxBlendShapes];
        
        if (debugMode)
        {
            LogToConsole("Advanced Lip Sync initialized");
        }
    }
    
    private void SetupEmotionModifiers()
    {
        emotionModifiers = new Dictionary<string, EmotionLipSyncModifier>();
        
        if (lipSyncData.emotionModifiers != null)
        {
            foreach (var modifier in lipSyncData.emotionModifiers)
            {
                emotionModifiers[modifier.emotionName] = modifier;
            }
        }
        
        // Standard-Modifier
        if (!emotionModifiers.ContainsKey("Neutral"))
        {
            emotionModifiers["Neutral"] = new EmotionLipSyncModifier
            {
                emotionName = "Neutral",
                mouthOpenMultiplier = 1.0f,
                mouthWidthMultiplier = 1.0f,
                lipMultiplier = 1.0f
            };
        }
        
        currentModifier = emotionModifiers["Neutral"];
    }
    
    private void SetupAudioAnalysis()
    {
        if (audioSource != null)
        {
            // Audio-Spectrum-Analyse aktivieren
            audioSource.GetSpectrumData(audioSpectrum, 0, FFTWindow.BlackmanHarris);
        }
    }
    
    private void AnalyzeAudio()
    {
        if (audioSource == null || !audioSource.isPlaying) return;
        
        // Audio-Spectrum analysieren
        audioSource.GetSpectrumData(audioSpectrum, 0, FFTWindow.BlackmanHarris);
        
        // Frequenz-Bereich für Mund-Bewegungen analysieren
        float mouthFrequency = 0f;
        int startIndex = Mathf.RoundToInt(lipSyncData.frequencyRange.x * audioSpectrum.Length / 22050f);
        int endIndex = Mathf.RoundToInt(lipSyncData.frequencyRange.y * audioSpectrum.Length / 22050f);
        
        for (int i = startIndex; i < endIndex && i < audioSpectrum.Length; i++)
        {
            mouthFrequency += audioSpectrum[i];
        }
        
        // Audio-Level berechnen
        audioLevel = Mathf.Clamp01(mouthFrequency * lipSyncData.audioSensitivity);
        
        if (debugMode && audioLevel > 0.1f)
        {
            LogToConsole($"Audio Level: {audioLevel:F2}");
        }
    }
    
    private void UpdateLipSync()
    {
        if (faceRenderer == null || lipSyncData == null) return;
        
        // Emotion-Modifier anwenden
        if (emotionModifiers.ContainsKey(currentEmotion))
        {
            currentModifier = emotionModifiers[currentEmotion];
        }
        
        // Mund-Öffnung
        if (lipSyncData.mouthOpenShapes != null)
        {
            float mouthOpenValue = audioLevel * currentModifier.mouthOpenMultiplier;
            mouthOpenValue = Mathf.Clamp(mouthOpenValue, lipSyncData.minThreshold, lipSyncData.maxThreshold);
            
            foreach (int shapeIndex in lipSyncData.mouthOpenShapes)
            {
                SetBlendShape(shapeIndex, mouthOpenValue * 100f);
            }
        }
        
        // Mund-Breite
        if (lipSyncData.mouthWidthShapes != null)
        {
            float mouthWidthValue = audioLevel * 0.7f * currentModifier.mouthWidthMultiplier;
            mouthWidthValue = Mathf.Clamp(mouthWidthValue, lipSyncData.minThreshold, lipSyncData.maxThreshold);
            
            foreach (int shapeIndex in lipSyncData.mouthWidthShapes)
            {
                SetBlendShape(shapeIndex, mouthWidthValue * 100f);
            }
        }
        
        // Lippen
        if (lipSyncData.lipShapes != null)
        {
            float lipValue = audioLevel * 0.5f * currentModifier.lipMultiplier;
            lipValue = Mathf.Clamp(lipValue, lipSyncData.minThreshold, lipSyncData.maxThreshold);
            
            foreach (int shapeIndex in lipSyncData.lipShapes)
            {
                SetBlendShape(shapeIndex, lipValue * 100f);
            }
        }
    }
    
    private void UpdateLipSyncFallback()
    {
        if (faceRenderer == null || lipSyncData == null) return;
        
        // Fallback: Sinus-basierte Animation
        float time = Time.time * 8f; // 8 Hz für natürliche Sprechgeschwindigkeit
        float baseValue = Mathf.Abs(Mathf.Sin(time)) * audioLevel;
        
        // Mund-Öffnung
        if (lipSyncData.mouthOpenShapes != null)
        {
            float mouthOpenValue = baseValue * currentModifier.mouthOpenMultiplier;
            mouthOpenValue = Mathf.Clamp(mouthOpenValue, lipSyncData.minThreshold, lipSyncData.maxThreshold);
            
            foreach (int shapeIndex in lipSyncData.mouthOpenShapes)
            {
                SetBlendShape(shapeIndex, mouthOpenValue * 100f);
            }
        }
    }
    
    private void SetBlendShape(int index, float weight)
    {
        if (faceRenderer != null && index < faceRenderer.sharedMesh.blendShapeCount)
        {
            // Smoothing anwenden
            float smoothedWeight = Mathf.Lerp(smoothedValues[index], weight, lipSyncData.smoothing);
            smoothedValues[index] = smoothedWeight;
            
            faceRenderer.SetBlendShapeWeight(index, smoothedWeight);
        }
    }
    
    private void ResetLipSync()
    {
        if (faceRenderer == null) return;
        
        // Alle Blend Shapes zurücksetzen
        for (int i = 0; i < faceRenderer.sharedMesh.blendShapeCount; i++)
        {
            smoothedValues[i] = 0f;
            faceRenderer.SetBlendShapeWeight(i, 0f);
        }
        
        audioLevel = 0f;
    }
    
    // Public Methods für JavaScript
    public void SetSpeakingFromJS(string speaking)
    {
        isSpeaking = bool.Parse(speaking);
        
        if (debugMode)
        {
            LogToConsole($"Speaking: {isSpeaking}");
        }
    }
    
    public void SetEmotionFromJS(string emotion)
    {
        currentEmotion = emotion;
        
        if (debugMode)
        {
            LogToConsole($"Emotion: {emotion}");
        }
    }
    
    public void SetAudioLevelFromJS(string level)
    {
        audioLevel = Mathf.Clamp01(float.Parse(level));
        
        if (debugMode)
        {
            LogToConsole($"Audio Level: {audioLevel:F2}");
        }
    }
    
    // Context Menu für Testing
    [ContextMenu("Test Lip Sync")]
    private void TestLipSync()
    {
        isSpeaking = true;
        audioLevel = 0.5f;
        Debug.Log("Lip Sync Test started");
    }
    
    [ContextMenu("Reset Lip Sync")]
    private void TestResetLipSync()
    {
        ResetLipSync();
        Debug.Log("Lip Sync Reset");
    }
    
    [ContextMenu("Analyze Blend Shapes")]
    private void AnalyzeBlendShapes()
    {
        if (faceRenderer != null && faceRenderer.sharedMesh != null)
        {
            Debug.Log($"Blend Shapes Count: {faceRenderer.sharedMesh.blendShapeCount}");
            
            for (int i = 0; i < faceRenderer.sharedMesh.blendShapeCount; i++)
            {
                string blendShapeName = faceRenderer.sharedMesh.GetBlendShapeName(i);
                Debug.Log($"Blend Shape {i}: {blendShapeName}");
            }
        }
    }
}

