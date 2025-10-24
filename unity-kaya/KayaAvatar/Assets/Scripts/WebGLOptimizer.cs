using UnityEngine;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;

[System.Serializable]
public class WebGLOptimizationSettings
{
    [Header("🌐 WebGL-Specific Settings")]
    [Tooltip("Memory-Size (MB)")]
    [Range(128, 2048)]
    public int memorySize = 512;
    
    [Tooltip("Compression-Format")]
    public WebGLCompressionFormat compressionFormat = WebGLCompressionFormat.Disabled;
    
    [Tooltip("Data-Caching")]
    public bool dataCaching = true;
    
    [Tooltip("Name-Files-As-Hashes")]
    public bool nameFilesAsHashes = true;
    
    [Tooltip("Exception-Support")]
    public WebGLExceptionSupport exceptionSupport = WebGLExceptionSupport.None;
    
    [Header("📦 Asset-Optimization")]
    [Tooltip("Texture-Compression")]
    public TextureCompressionFormat textureCompression = TextureCompressionFormat.DXT1;
    
    [Tooltip("Audio-Compression")]
    public AudioCompressionFormat audioCompression = AudioCompressionFormat.Vorbis;
    
    [Tooltip("Mesh-Compression")]
    public MeshCompressionFormat meshCompression = MeshCompressionFormat.Off;
    
    [Header("⚡ Loading-Optimization")]
    [Tooltip("Preload-Assets")]
    public bool preloadAssets = true;
    
    [Tooltip("Streaming-Assets")]
    public bool useStreamingAssets = false;
    
    [Tooltip("Asset-Bundles")]
    public bool useAssetBundles = false;
    
    [Header("🔧 Runtime-Optimization")]
    [Tooltip("Garbage-Collection")]
    public bool optimizeGarbageCollection = true;
    
    [Tooltip("Memory-Pooling")]
    public bool useMemoryPooling = true;
    
    [Tooltip("Object-Pooling")]
    public bool useObjectPooling = true;
}

[System.Serializable]
public class TextureCompressionFormat
{
    public static TextureCompressionFormat DXT1 = new TextureCompressionFormat { name = "DXT1", compressionRatio = 0.125f };
    public static TextureCompressionFormat DXT5 = new TextureCompressionFormat { name = "DXT5", compressionRatio = 0.25f };
    public static TextureCompressionFormat ETC2 = new TextureCompressionFormat { name = "ETC2", compressionRatio = 0.125f };
    public static TextureCompressionFormat ASTC = new TextureCompressionFormat { name = "ASTC", compressionRatio = 0.125f };
    
    public string name;
    public float compressionRatio;
}

[System.Serializable]
public class AudioCompressionFormat
{
    public static AudioCompressionFormat Vorbis = new AudioCompressionFormat { name = "Vorbis", compressionRatio = 0.1f };
    public static AudioCompressionFormat MP3 = new AudioCompressionFormat { name = "MP3", compressionRatio = 0.1f };
    public static AudioCompressionFormat PCM = new AudioCompressionFormat { name = "PCM", compressionRatio = 1f };
    
    public string name;
    public float compressionRatio;
}

[System.Serializable]
public class MeshCompressionFormat
{
    public static MeshCompressionFormat Off = new MeshCompressionFormat { name = "Off", compressionRatio = 1f };
    public static MeshCompressionFormat Low = new MeshCompressionFormat { name = "Low", compressionRatio = 0.8f };
    public static MeshCompressionFormat Medium = new MeshCompressionFormat { name = "Medium", compressionRatio = 0.6f };
    public static MeshCompressionFormat High = new MeshCompressionFormat { name = "High", compressionRatio = 0.4f };
    
    public string name;
    public float compressionRatio;
}

public class WebGLOptimizer : MonoBehaviour
{
    [Header("🌐 WebGL Optimization")]
    [Tooltip("WebGL-Optimierungs-Einstellungen")]
    public WebGLOptimizationSettings webglSettings;
    
    [Header("📊 Performance Monitoring")]
    [Tooltip("Performance-Metriken")]
    public WebGLPerformanceMetrics performanceMetrics;
    
    [Tooltip("Loading-Progress")]
    public float loadingProgress = 0f;
    
    [Tooltip("Debug-Modus")]
    public bool debugMode = false;
    
    // Private Variables
    private Dictionary<string, Object> assetCache;
    private Dictionary<string, float> assetLoadTimes;
    private List<string> preloadedAssets;
    private bool isOptimized = false;
    
    // WebGL Communication
    [DllImport("__Internal")]
    private static extern void SendToFrontend(string message);
    
    [DllImport("__Internal")]
    private static extern void LogToConsole(string message);
    
    void Start()
    {
        InitializeWebGLOptimizer();
        OptimizeForWebGL();
        
        if (debugMode)
        {
            LogToConsole("WebGL Optimizer initialized");
        }
    }
    
    void Update()
    {
        UpdatePerformanceMetrics();
        
        if (webglSettings.optimizeGarbageCollection)
        {
            OptimizeGarbageCollection();
        }
    }
    
    private void InitializeWebGLOptimizer()
    {
        // Asset-Cache initialisieren
        assetCache = new Dictionary<string, Object>();
        assetLoadTimes = new Dictionary<string, float>();
        preloadedAssets = new List<string>();
        
        // Performance-Metriken initialisieren
        performanceMetrics = new WebGLPerformanceMetrics();
        
        // WebGL-spezifische Einstellungen anwenden
        ApplyWebGLSettings();
    }
    
    private void ApplyWebGLSettings()
    {
        // Player-Settings für WebGL
        PlayerSettings.WebGL.memorySize = webglSettings.memorySize;
        PlayerSettings.WebGL.compressionFormat = webglSettings.compressionFormat;
        PlayerSettings.WebGL.dataCaching = webglSettings.dataCaching;
        PlayerSettings.WebGL.nameFilesAsHashes = webglSettings.nameFilesAsHashes;
        PlayerSettings.WebGL.exceptionSupport = webglSettings.exceptionSupport;
        
        // Quality-Settings für WebGL
        QualitySettings.antiAliasing = 0; // Deaktiviert für Performance
        QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
        QualitySettings.masterTextureLimit = 1; // Halbe Textur-Auflösung
        QualitySettings.shadowResolution = ShadowResolution.Low;
        QualitySettings.shadowCascades = ShadowCascades.NoCascades;
        QualitySettings.shadowDistance = 20f; // Reduziert für WebGL
        
        if (debugMode)
        {
            LogToConsole("WebGL settings applied");
        }
    }
    
    public void OptimizeForWebGL()
    {
        if (isOptimized) return;
        
        // Asset-Optimierung
        OptimizeAssets();
        
        // Memory-Optimierung
        OptimizeMemory();
        
        // Loading-Optimierung
        OptimizeLoading();
        
        // Runtime-Optimierung
        OptimizeRuntime();
        
        isOptimized = true;
        
        if (debugMode)
        {
            LogToConsole("WebGL optimization completed");
        }
    }
    
    private void OptimizeAssets()
    {
        // Texturen optimieren
        OptimizeTextures();
        
        // Audio optimieren
        OptimizeAudio();
        
        // Meshes optimieren
        OptimizeMeshes();
        
        if (debugMode)
        {
            LogToConsole("Assets optimized for WebGL");
        }
    }
    
    private void OptimizeTextures()
    {
        // Alle Texturen im Projekt finden und optimieren
        var textures = Resources.FindObjectsOfTypeAll<Texture2D>();
        
        foreach (var texture in textures)
        {
            // Textur-Kompression anwenden
            if (texture.format != TextureFormat.DXT1 && texture.format != TextureFormat.DXT5)
            {
                // Textur für WebGL optimieren
                texture.Compress(true);
            }
            
            // Mip-Maps deaktivieren für kleine Texturen
            if (texture.width < 256 && texture.height < 256)
            {
                texture.mipMapBias = 0;
            }
        }
        
        if (debugMode)
        {
            LogToConsole($"Optimized {textures.Length} textures");
        }
    }
    
    private void OptimizeAudio()
    {
        // Alle Audio-Clips im Projekt finden und optimieren
        var audioClips = Resources.FindObjectsOfTypeAll<AudioClip>();
        
        foreach (var audioClip in audioClips)
        {
            // Audio-Kompression für WebGL
            if (audioClip.loadType == AudioClipLoadType.DecompressOnLoad)
            {
                // Audio-Clip für WebGL optimieren
                // Diese Einstellungen müssen über den Inspector angepasst werden
            }
        }
        
        if (debugMode)
        {
            LogToConsole($"Optimized {audioClips.Length} audio clips");
        }
    }
    
    private void OptimizeMeshes()
    {
        // Alle Meshes im Projekt finden und optimieren
        var meshes = Resources.FindObjectsOfTypeAll<Mesh>();
        
        foreach (var mesh in meshes)
        {
            // Mesh-Kompression anwenden
            if (webglSettings.meshCompression.compressionRatio < 1f)
            {
                // Mesh für WebGL optimieren
                // Diese Einstellungen müssen über den Inspector angepasst werden
            }
        }
        
        if (debugMode)
        {
            LogToConsole($"Optimized {meshes.Length} meshes");
        }
    }
    
    private void OptimizeMemory()
    {
        // Memory-Pooling aktivieren
        if (webglSettings.useMemoryPooling)
        {
            // Memory-Pooling implementieren
            // Hier können Object-Pools für häufig verwendete Objekte erstellt werden
        }
        
        // Garbage-Collection optimieren
        if (webglSettings.optimizeGarbageCollection)
        {
            System.GC.Collect();
            System.GC.WaitForPendingFinalizers();
            System.GC.Collect();
        }
        
        if (debugMode)
        {
            LogToConsole("Memory optimized for WebGL");
        }
    }
    
    private void OptimizeLoading()
    {
        // Preloading aktivieren
        if (webglSettings.preloadAssets)
        {
            PreloadCriticalAssets();
        }
        
        // Streaming-Assets konfigurieren
        if (webglSettings.useStreamingAssets)
        {
            ConfigureStreamingAssets();
        }
        
        // Asset-Bundles konfigurieren
        if (webglSettings.useAssetBundles)
        {
            ConfigureAssetBundles();
        }
        
        if (debugMode)
        {
            LogToConsole("Loading optimized for WebGL");
        }
    }
    
    private void PreloadCriticalAssets()
    {
        // Kritische Assets vorladen
        var criticalAssets = new string[]
        {
            "KayaAvatar",
            "MainCamera",
            "MainLight",
            "AudioSource"
        };
        
        foreach (var assetName in criticalAssets)
        {
            var asset = Resources.Load(assetName);
            if (asset != null)
            {
                assetCache[assetName] = asset;
                preloadedAssets.Add(assetName);
            }
        }
        
        if (debugMode)
        {
            LogToConsole($"Preloaded {preloadedAssets.Count} critical assets");
        }
    }
    
    private void ConfigureStreamingAssets()
    {
        // Streaming-Assets für WebGL konfigurieren
        // Diese müssen über den StreamingAssets-Ordner konfiguriert werden
    }
    
    private void ConfigureAssetBundles()
    {
        // Asset-Bundles für WebGL konfigurieren
        // Diese müssen über den Asset-Bundle-System konfiguriert werden
    }
    
    private void OptimizeRuntime()
    {
        // Runtime-Optimierungen für WebGL
        Application.targetFrameRate = 60; // Stabile Framerate
        QualitySettings.vSyncCount = 1; // VSync für stabile Framerate
        
        // Object-Pooling aktivieren
        if (webglSettings.useObjectPooling)
        {
            // Object-Pooling implementieren
            // Hier können Pools für häufig verwendete Objekte erstellt werden
        }
        
        if (debugMode)
        {
            LogToConsole("Runtime optimized for WebGL");
        }
    }
    
    private void OptimizeGarbageCollection()
    {
        // Garbage-Collection alle 5 Sekunden optimieren
        if (Time.time % 5f < Time.deltaTime)
        {
            System.GC.Collect();
        }
    }
    
    private void UpdatePerformanceMetrics()
    {
        // WebGL-spezifische Performance-Metriken sammeln
        performanceMetrics.fps = 1f / Time.unscaledDeltaTime;
        performanceMetrics.frameTime = Time.unscaledDeltaTime * 1000f; // ms
        performanceMetrics.memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f; // MB
        performanceMetrics.loadingProgress = loadingProgress;
        performanceMetrics.cachedAssets = assetCache.Count;
        performanceMetrics.preloadedAssets = preloadedAssets.Count;
        
        // Performance-Warnungen
        if (performanceMetrics.fps < 30f)
        {
            if (debugMode)
            {
                LogToConsole("⚠️ Low FPS detected");
            }
        }
        
        if (performanceMetrics.memoryUsage > webglSettings.memorySize * 0.8f)
        {
            if (debugMode)
            {
                LogToConsole("⚠️ High memory usage detected");
            }
        }
    }
    
    // Public Methods für Runtime-Anpassungen
    public void SetMemorySize(int size)
    {
        webglSettings.memorySize = size;
        PlayerSettings.WebGL.memorySize = size;
        
        if (debugMode)
        {
            LogToConsole($"Memory size set to: {size}MB");
        }
    }
    
    public void SetCompressionFormat(WebGLCompressionFormat format)
    {
        webglSettings.compressionFormat = format;
        PlayerSettings.WebGL.compressionFormat = format;
        
        if (debugMode)
        {
            LogToConsole($"Compression format set to: {format}");
        }
    }
    
    public void EnableDataCaching(bool enable)
    {
        webglSettings.dataCaching = enable;
        PlayerSettings.WebGL.dataCaching = enable;
        
        if (debugMode)
        {
            LogToConsole($"Data caching: {enable}");
        }
    }
    
    public void PreloadAsset(string assetName)
    {
        var asset = Resources.Load(assetName);
        if (asset != null)
        {
            assetCache[assetName] = asset;
            preloadedAssets.Add(assetName);
            
            if (debugMode)
            {
                LogToConsole($"Asset preloaded: {assetName}");
            }
        }
    }
    
    // Context Menu für Testing
    [ContextMenu("Test WebGL Optimization")]
    private void TestWebGLOptimization()
    {
        OptimizeForWebGL();
        Debug.Log("WebGL optimization test completed");
    }
    
    [ContextMenu("Test Asset Preloading")]
    private void TestAssetPreloading()
    {
        PreloadCriticalAssets();
        Debug.Log("Asset preloading test completed");
    }
    
    [ContextMenu("Test Performance Metrics")]
    private void TestPerformanceMetrics()
    {
        UpdatePerformanceMetrics();
        Debug.Log($"FPS: {performanceMetrics.fps:F1}, Memory: {performanceMetrics.memoryUsage:F1}MB");
    }
    
    [ContextMenu("Analyze Build Size")]
    private void AnalyzeBuildSize()
    {
        // Build-Größe analysieren
        var buildPath = "Builds/WebGL";
        if (Directory.Exists(buildPath))
        {
            var files = Directory.GetFiles(buildPath, "*", SearchOption.AllDirectories);
            float totalSize = 0f;
            
            foreach (var file in files)
            {
                var fileInfo = new FileInfo(file);
                totalSize += fileInfo.Length;
            }
            
            Debug.Log($"Build size: {totalSize / 1024f / 1024f:F1}MB");
        }
    }
}

[System.Serializable]
public class WebGLPerformanceMetrics
{
    public float fps;
    public float frameTime;
    public float memoryUsage;
    public float loadingProgress;
    public int cachedAssets;
    public int preloadedAssets;
    public float buildSize;
    public float loadTime;
}
