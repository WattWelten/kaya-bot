using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using System.Collections.Generic;
using System.Linq;

[System.Serializable]
public class AIPerformanceSettings
{
    [Header("⚡ AI-Specific Optimizations")]
    [Tooltip("AI-Update-Rate (Hz)")]
    [Range(10, 60)]
    public int aiUpdateRate = 30;
    
    [Tooltip("Avatar-Update-Rate (Hz)")]
    [Range(10, 60)]
    public int avatarUpdateRate = 30;
    
    [Tooltip("Lip-Sync-Update-Rate (Hz)")]
    [Range(10, 60)]
    public int lipSyncUpdateRate = 30;
    
    [Tooltip("Emotion-Update-Rate (Hz)")]
    [Range(5, 30)]
    public int emotionUpdateRate = 10;
    
    [Header("🎭 LOD Settings")]
    [Tooltip("LOD-Levels")]
    public LODLevel[] lodLevels;
    
    [Tooltip("Aktueller LOD-Level")]
    [Range(0, 3)]
    public int currentLODLevel = 0;
    
    [Tooltip("LOD-Switch-Distanz")]
    public float lodSwitchDistance = 10f;
    
    [Header("🔧 Rendering Optimizations")]
    [Tooltip("Shadow-Distanz")]
    public float shadowDistance = 20f;
    
    [Tooltip("Shadow-Cascades")]
    public ShadowCascades shadowCascades = ShadowCascades.NoCascades;
    
    [Tooltip("Shadow-Resolution")]
    public ShadowResolution shadowResolution = ShadowResolution.Low;
    
    [Tooltip("Anti-Aliasing")]
    public int antiAliasing = 0;
    
    [Tooltip("Texture-Quality")]
    [Range(0, 3)]
    public int textureQuality = 1;
    
    [Header("🎨 Material Optimizations")]
    [Tooltip("Material-LOD-Bias")]
    [Range(0.1f, 5f)]
    public float materialLODBias = 1f;
    
    [Tooltip("Anisotropic-Filtering")]
    public AnisotropicFiltering anisotropicFiltering = AnisotropicFiltering.Disable;
    
    [Tooltip("Master-Texture-Limit")]
    [Range(0, 3)]
    public int masterTextureLimit = 1;
}

[System.Serializable]
public class LODLevel
{
    [Tooltip("LOD-Level")]
    public int level;
    
    [Tooltip("Mesh-Quality")]
    [Range(0.1f, 1f)]
    public float meshQuality = 1f;
    
    [Tooltip("Texture-Quality")]
    [Range(0.1f, 1f)]
    public float textureQuality = 1f;
    
    [Tooltip("Animation-Quality")]
    [Range(0.1f, 1f)]
    public float animationQuality = 1f;
    
    [Tooltip("Blend-Shape-Quality")]
    [Range(0.1f, 1f)]
    public float blendShapeQuality = 1f;
    
    [Tooltip("Shadow-Quality")]
    [Range(0.1f, 1f)]
    public float shadowQuality = 1f;
}

public class PerformanceOptimizer : MonoBehaviour
{
    [Header("⚡ Performance Settings")]
    [Tooltip("AI-Performance-Konfiguration")]
    public AIPerformanceSettings performanceSettings;
    
    [Header("🎭 Avatar Components")]
    [Tooltip("Avatar-Controller")]
    public KayaAvatarController avatarController;
    
    [Tooltip("Lip-Sync-Controller")]
    public AdvancedLipSyncController lipSyncController;
    
    [Tooltip("Skinned-Mesh-Renderer")]
    public SkinnedMeshRenderer avatarRenderer;
    
    [Header("🔧 Runtime Settings")]
    [Tooltip("Aktuelle Performance-Metriken")]
    public PerformanceMetrics currentMetrics;
    
    [Tooltip("Performance-Monitoring")]
    public bool performanceMonitoring = true;
    
    [Tooltip("Auto-LOD-Switching")]
    public bool autoLODSwitching = true;
    
    [Tooltip("Debug-Modus")]
    public bool debugMode = false;
    
    // Private Variables
    private float lastAIUpdateTime = 0f;
    private float lastAvatarUpdateTime = 0f;
    private float lastLipSyncUpdateTime = 0f;
    private float lastEmotionUpdateTime = 0f;
    private float lastLODUpdateTime = 0f;
    private Camera mainCamera;
    private Dictionary<int, LODLevel> lodLevels;
    
    // WebGL Communication
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void SendToFrontend(string message);
    
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void LogToConsole(string message);
    
    void Start()
    {
        InitializePerformanceOptimizer();
        SetupLODLevels();
        OptimizeForAI();
        
        if (debugMode)
        {
            LogToConsole("Performance Optimizer initialized");
        }
    }
    
    void Update()
    {
        if (performanceMonitoring)
        {
            UpdatePerformanceMetrics();
        }
        
        if (autoLODSwitching)
        {
            UpdateLOD();
        }
        
        // Performance-optimierte Updates
        UpdateAI();
        UpdateAvatar();
        UpdateLipSync();
        UpdateEmotions();
    }
    
    private void InitializePerformanceOptimizer()
    {
        // Komponenten finden
        if (avatarController == null)
        {
            avatarController = GetComponent<KayaAvatarController>();
        }
        
        if (lipSyncController == null)
        {
            lipSyncController = GetComponent<AdvancedLipSyncController>();
        }
        
        if (avatarRenderer == null)
        {
            avatarRenderer = GetComponent<SkinnedMeshRenderer>();
        }
        
        mainCamera = Camera.main;
        
        // Performance-Settings anwenden
        ApplyPerformanceSettings();
        
        // LOD-Levels initialisieren
        if (performanceSettings.lodLevels == null || performanceSettings.lodLevels.Length == 0)
        {
            CreateDefaultLODLevels();
        }
    }
    
    private void SetupLODLevels()
    {
        lodLevels = new Dictionary<int, LODLevel>();
        
        if (performanceSettings.lodLevels != null)
        {
            foreach (var lodLevel in performanceSettings.lodLevels)
            {
                lodLevels[lodLevel.level] = lodLevel;
            }
        }
    }
    
    private void CreateDefaultLODLevels()
    {
        performanceSettings.lodLevels = new LODLevel[]
        {
            new LODLevel { level = 0, meshQuality = 1f, textureQuality = 1f, animationQuality = 1f, blendShapeQuality = 1f, shadowQuality = 1f },
            new LODLevel { level = 1, meshQuality = 0.8f, textureQuality = 0.8f, animationQuality = 0.8f, blendShapeQuality = 0.8f, shadowQuality = 0.8f },
            new LODLevel { level = 2, meshQuality = 0.6f, textureQuality = 0.6f, animationQuality = 0.6f, blendShapeQuality = 0.6f, shadowQuality = 0.6f },
            new LODLevel { level = 3, meshQuality = 0.4f, textureQuality = 0.4f, animationQuality = 0.4f, blendShapeQuality = 0.4f, shadowQuality = 0.4f }
        };
        
        SetupLODLevels();
    }
    
    private void OptimizeForAI()
    {
        // AI-spezifische Optimierungen
        QualitySettings.vSyncCount = 1; // VSync für stabile Framerate
        QualitySettings.maxQueuedFrames = 1; // Minimale Input-Lag
        
        // Rendering-Pipeline optimieren
        var urpAsset = GraphicsSettings.renderPipelineAsset as UniversalRenderPipelineAsset;
        if (urpAsset != null)
        {
            // URP-Asset-Einstellungen optimieren
            // Diese müssen über den Inspector angepasst werden
        }
        
        // Memory-Management
        System.GC.Collect(); // Garbage Collection optimieren
        
        if (debugMode)
        {
            LogToConsole("AI optimizations applied");
        }
    }
    
    private void ApplyPerformanceSettings()
    {
        // Quality-Settings anwenden
        QualitySettings.shadowDistance = performanceSettings.shadowDistance;
        QualitySettings.shadowCascades = performanceSettings.shadowCascades;
        QualitySettings.shadowResolution = performanceSettings.shadowResolution;
        QualitySettings.antiAliasing = performanceSettings.antiAliasing;
        QualitySettings.masterTextureLimit = performanceSettings.masterTextureLimit;
        QualitySettings.anisotropicFiltering = performanceSettings.anisotropicFiltering;
        QualitySettings.lodBias = performanceSettings.materialLODBias;
        
        // Texture-Quality
        QualitySettings.SetQualityLevel(performanceSettings.textureQuality);
    }
    
    private void UpdatePerformanceMetrics()
    {
        // Performance-Metriken sammeln
        currentMetrics.fps = 1f / Time.unscaledDeltaTime;
        currentMetrics.frameTime = Time.unscaledDeltaTime * 1000f; // ms
        currentMetrics.memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f; // MB
        currentMetrics.drawCalls = UnityEngine.Profiling.Profiler.GetRuntimeMemorySize(avatarRenderer) / 1024f / 1024f; // MB
        
        // LOD-Level basierend auf Performance anpassen
        if (currentMetrics.fps < 30f && performanceSettings.currentLODLevel < 3)
        {
            SetLODLevel(performanceSettings.currentLODLevel + 1);
        }
        else if (currentMetrics.fps > 50f && performanceSettings.currentLODLevel > 0)
        {
            SetLODLevel(performanceSettings.currentLODLevel - 1);
        }
    }
    
    private void UpdateLOD()
    {
        if (Time.time - lastLODUpdateTime < 0.5f) return; // Alle 0.5 Sekunden prüfen
        
        lastLODUpdateTime = Time.time;
        
        if (mainCamera != null && avatarRenderer != null)
        {
            float distance = Vector3.Distance(mainCamera.transform.position, avatarRenderer.transform.position);
            
            int newLODLevel = 0;
            if (distance > performanceSettings.lodSwitchDistance * 3)
            {
                newLODLevel = 3;
            }
            else if (distance > performanceSettings.lodSwitchDistance * 2)
            {
                newLODLevel = 2;
            }
            else if (distance > performanceSettings.lodSwitchDistance)
            {
                newLODLevel = 1;
            }
            
            if (newLODLevel != performanceSettings.currentLODLevel)
            {
                SetLODLevel(newLODLevel);
            }
        }
    }
    
    private void SetLODLevel(int level)
    {
        if (lodLevels.ContainsKey(level))
        {
            performanceSettings.currentLODLevel = level;
            var lodLevel = lodLevels[level];
            
            // LOD-Einstellungen anwenden
            ApplyLODSettings(lodLevel);
            
            if (debugMode)
            {
                LogToConsole($"LOD Level set to: {level}");
            }
        }
    }
    
    private void ApplyLODSettings(LODLevel lodLevel)
    {
        // Mesh-Quality
        if (avatarRenderer != null)
        {
            // Mesh-Quality über Material-LOD-Bias anpassen
            QualitySettings.lodBias = lodLevel.meshQuality;
        }
        
        // Texture-Quality
        QualitySettings.masterTextureLimit = Mathf.RoundToInt(3f * (1f - lodLevel.textureQuality));
        
        // Animation-Quality
        if (avatarController != null)
        {
            avatarController.updateRate = Mathf.RoundToInt(60f * lodLevel.animationQuality);
        }
        
        // Blend-Shape-Quality
        if (lipSyncController != null)
        {
            lipSyncController.lipSyncData.updateRate = Mathf.RoundToInt(30f * lodLevel.blendShapeQuality);
        }
        
        // Shadow-Quality
        QualitySettings.shadowDistance = performanceSettings.shadowDistance * lodLevel.shadowQuality;
    }
    
    private void UpdateAI()
    {
        if (Time.time - lastAIUpdateTime < 1f / performanceSettings.aiUpdateRate)
            return;
            
        lastAIUpdateTime = Time.time;
        
        // AI-spezifische Updates
        // Hier können AI-Algorithmen, Emotion-Analyse, etc. implementiert werden
    }
    
    private void UpdateAvatar()
    {
        if (Time.time - lastAvatarUpdateTime < 1f / performanceSettings.avatarUpdateRate)
            return;
            
        lastAvatarUpdateTime = Time.time;
        
        // Avatar-spezifische Updates
        if (avatarController != null)
        {
            // Avatar-Controller-Updates
        }
    }
    
    private void UpdateLipSync()
    {
        if (Time.time - lastLipSyncUpdateTime < 1f / performanceSettings.lipSyncUpdateRate)
            return;
            
        lastLipSyncUpdateTime = Time.time;
        
        // Lip-Sync-Updates
        if (lipSyncController != null)
        {
            // Lip-Sync-Controller-Updates
        }
    }
    
    private void UpdateEmotions()
    {
        if (Time.time - lastEmotionUpdateTime < 1f / performanceSettings.emotionUpdateRate)
            return;
            
        lastEmotionUpdateTime = Time.time;
        
        // Emotion-Updates
        if (avatarController != null)
        {
            // Emotion-Controller-Updates
        }
    }
    
    // Public Methods für Runtime-Anpassungen
    public void SetPerformanceLevel(int level)
    {
        performanceSettings.textureQuality = level;
        ApplyPerformanceSettings();
        
        if (debugMode)
        {
            LogToConsole($"Performance level set to: {level}");
        }
    }
    
    public void SetLODLevel(int level)
    {
        SetLODLevel(level);
    }
    
    public void EnablePerformanceMonitoring(bool enable)
    {
        performanceMonitoring = enable;
    }
    
    public void EnableAutoLODSwitching(bool enable)
    {
        autoLODSwitching = enable;
    }
    
    // Context Menu für Testing
    [ContextMenu("Test Performance")]
    private void TestPerformance()
    {
        UpdatePerformanceMetrics();
        Debug.Log($"FPS: {currentMetrics.fps:F1}, Memory: {currentMetrics.memoryUsage:F1}MB");
    }
    
    [ContextMenu("Test LOD Switching")]
    private void TestLODSwitching()
    {
        for (int i = 0; i < 4; i++)
        {
            SetLODLevel(i);
            Debug.Log($"LOD Level {i} applied");
        }
    }
    
    [ContextMenu("Optimize for WebGL")]
    private void TestWebGLOptimization()
    {
        OptimizeForAI();
        Debug.Log("WebGL optimization applied");
    }
}

[System.Serializable]
public class PerformanceMetrics
{
    public float fps;
    public float frameTime;
    public float memoryUsage;
    public float drawCalls;
    public int lodLevel;
    public float distanceToCamera;
}
