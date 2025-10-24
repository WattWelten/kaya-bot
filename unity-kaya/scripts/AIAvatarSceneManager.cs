using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using Cinemachine;

[System.Serializable]
public class AIAvatarSceneSettings
{
    [Header("🎥 Camera Configuration")]
    [Tooltip("Haupt-Kamera für Avatar")]
    public Camera mainCamera;
    
    [Tooltip("Cinemachine Virtual Camera")]
    public CinemachineVirtualCamera virtualCamera;
    
    [Tooltip("Kamera-Position relativ zum Avatar")]
    public Vector3 cameraOffset = new Vector3(0, 1.6f, 2.5f);
    
    [Tooltip("Kamera-Rotation")]
    public Vector3 cameraRotation = new Vector3(15, 0, 0);
    
    [Tooltip("Field of View für WebGL")]
    [Range(30, 90)]
    public float fieldOfView = 60f;
    
    [Tooltip("Near Clipping Plane")]
    public float nearClip = 0.1f;
    
    [Tooltip("Far Clipping Plane")]
    public float farClip = 100f;
    
    [Header("💡 Lighting Configuration")]
    [Tooltip("Haupt-Lichtquelle")]
    public Light mainLight;
    
    [Tooltip("Fill Light")]
    public Light fillLight;
    
    [Tooltip("Rim Light")]
    public Light rimLight;
    
    [Tooltip("Ambient Light Color")]
    public Color ambientColor = new Color(0.2f, 0.2f, 0.2f, 1f);
    
    [Header("🎭 Avatar Configuration")]
    [Tooltip("Avatar Root Transform")]
    public Transform avatarRoot;
    
    [Tooltip("Avatar Position")]
    public Vector3 avatarPosition = Vector3.zero;
    
    [Tooltip("Avatar Scale")]
    public Vector3 avatarScale = Vector3.one;
    
    [Tooltip("Avatar Rotation")]
    public Vector3 avatarRotation = Vector3.zero;
    
    [Header("⚡ Performance Settings")]
    [Tooltip("Target Frame Rate")]
    [Range(30, 120)]
    public int targetFrameRate = 60;
    
    [Tooltip("VSync Count")]
    public int vSyncCount = 1;
    
    [Tooltip("Quality Level")]
    [Range(0, 5)]
    public int qualityLevel = 2;
    
    [Tooltip("Shadow Distance")]
    public float shadowDistance = 50f;
    
    [Tooltip("LOD Bias")]
    [Range(0.1f, 5f)]
    public float lodBias = 1f;
}

public class AIAvatarSceneManager : MonoBehaviour
{
    [Header("🎬 Scene Settings")]
    [Tooltip("Scene-Konfiguration")]
    public AIAvatarSceneSettings sceneSettings;
    
    [Header("🗣️ Lip Sync Configuration")]
    [Tooltip("Lip-Sync-Blend-Shapes")]
    public LipSyncBlendShapeData lipSyncData;
    
    [Header("🎨 Rendering Pipeline")]
    [Tooltip("URP Asset")]
    public UniversalRenderPipelineAsset urpAsset;
    
    [Header("🔧 Debug Settings")]
    [Tooltip("Debug-Modus")]
    public bool debugMode = false;
    
    [Tooltip("Show Performance Stats")]
    public bool showPerformanceStats = false;
    
    // Private Variables
    private KayaAvatarController avatarController;
    private PerformanceOptimizer performanceOptimizer;
    private WebGLOptimizer webglOptimizer;
    
    void Start()
    {
        InitializeScene();
        SetupCamera();
        SetupLighting();
        SetupAvatar();
        OptimizeForWebGL();
        SetupLipSync();
        
        if (debugMode)
        {
            Debug.Log("✅ AI Avatar Scene initialized");
        }
    }
    
    void Update()
    {
        if (showPerformanceStats)
        {
            UpdatePerformanceStats();
        }
    }
    
    private void InitializeScene()
    {
        // Scene-Settings anwenden
        Application.targetFrameRate = sceneSettings.targetFrameRate;
        QualitySettings.vSyncCount = sceneSettings.vSyncCount;
        QualitySettings.SetQualityLevel(sceneSettings.qualityLevel);
        QualitySettings.shadowDistance = sceneSettings.shadowDistance;
        QualitySettings.lodBias = sceneSettings.lodBias;
        
        // URP Asset setzen
        if (urpAsset != null)
        {
            GraphicsSettings.renderPipelineAsset = urpAsset;
        }
        
        // Performance-Optimierer initialisieren
        performanceOptimizer = GetComponent<PerformanceOptimizer>();
        if (performanceOptimizer == null)
        {
            performanceOptimizer = gameObject.AddComponent<PerformanceOptimizer>();
        }
        
        // WebGL-Optimierer initialisieren
        webglOptimizer = GetComponent<WebGLOptimizer>();
        if (webglOptimizer == null)
        {
            webglOptimizer = gameObject.AddComponent<WebGLOptimizer>();
        }
    }
    
    private void SetupCamera()
    {
        // Haupt-Kamera konfigurieren
        if (sceneSettings.mainCamera == null)
        {
            sceneSettings.mainCamera = Camera.main;
            if (sceneSettings.mainCamera == null)
            {
                GameObject cameraGO = new GameObject("Main Camera");
                sceneSettings.mainCamera = cameraGO.AddComponent<Camera>();
                cameraGO.tag = "MainCamera";
            }
        }
        
        // Kamera-Einstellungen
        sceneSettings.mainCamera.fieldOfView = sceneSettings.fieldOfView;
        sceneSettings.mainCamera.nearClipPlane = sceneSettings.nearClip;
        sceneSettings.mainCamera.farClipPlane = sceneSettings.farClip;
        
        // Cinemachine Virtual Camera
        if (sceneSettings.virtualCamera == null)
        {
            GameObject vcamGO = new GameObject("CM vcam1");
            sceneSettings.virtualCamera = vcamGO.AddComponent<CinemachineVirtualCamera>();
        }
        
        // Virtual Camera konfigurieren
        sceneSettings.virtualCamera.m_Lens.FieldOfView = sceneSettings.fieldOfView;
        sceneSettings.virtualCamera.m_Lens.NearClipPlane = sceneSettings.nearClip;
        sceneSettings.virtualCamera.m_Lens.FarClipPlane = sceneSettings.farClip;
        
        // Follow Target setzen
        if (sceneSettings.avatarRoot != null)
        {
            sceneSettings.virtualCamera.Follow = sceneSettings.avatarRoot;
            sceneSettings.virtualCamera.LookAt = sceneSettings.avatarRoot;
        }
        
        // Kamera-Position
        if (sceneSettings.avatarRoot != null)
        {
            Vector3 cameraPos = sceneSettings.avatarRoot.position + sceneSettings.cameraOffset;
            sceneSettings.mainCamera.transform.position = cameraPos;
            sceneSettings.mainCamera.transform.rotation = Quaternion.Euler(sceneSettings.cameraRotation);
        }
    }
    
    private void SetupLighting()
    {
        // Ambient Light
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
        RenderSettings.ambientSkyColor = sceneSettings.ambientColor;
        RenderSettings.ambientEquatorColor = sceneSettings.ambientColor * 0.8f;
        RenderSettings.ambientGroundColor = sceneSettings.ambientColor * 0.6f;
        
        // Haupt-Licht
        if (sceneSettings.mainLight == null)
        {
            GameObject lightGO = new GameObject("Main Light");
            sceneSettings.mainLight = lightGO.AddComponent<Light>();
        }
        
        sceneSettings.mainLight.type = LightType.Directional;
        sceneSettings.mainLight.color = Color.white;
        sceneSettings.mainLight.intensity = 1.2f;
        sceneSettings.mainLight.shadows = LightShadows.Soft;
        sceneSettings.mainLight.shadowStrength = 0.8f;
        sceneSettings.mainLight.transform.rotation = Quaternion.Euler(45, 30, 0);
        
        // Fill Light
        if (sceneSettings.fillLight == null)
        {
            GameObject fillLightGO = new GameObject("Fill Light");
            sceneSettings.fillLight = fillLightGO.AddComponent<Light>();
        }
        
        sceneSettings.fillLight.type = LightType.Directional;
        sceneSettings.fillLight.color = new Color(0.8f, 0.9f, 1f);
        sceneSettings.fillLight.intensity = 0.4f;
        sceneSettings.fillLight.shadows = LightShadows.None;
        sceneSettings.fillLight.transform.rotation = Quaternion.Euler(-30, -30, 0);
        
        // Rim Light
        if (sceneSettings.rimLight == null)
        {
            GameObject rimLightGO = new GameObject("Rim Light");
            sceneSettings.rimLight = rimLightGO.AddComponent<Light>();
        }
        
        sceneSettings.rimLight.type = LightType.Directional;
        sceneSettings.rimLight.color = new Color(1f, 0.8f, 0.6f);
        sceneSettings.rimLight.intensity = 0.3f;
        sceneSettings.rimLight.shadows = LightShadows.None;
        sceneSettings.rimLight.transform.rotation = Quaternion.Euler(0, 180, 0);
    }
    
    private void SetupAvatar()
    {
        // Avatar Root finden
        if (sceneSettings.avatarRoot == null)
        {
            sceneSettings.avatarRoot = FindObjectOfType<KayaAvatarController>()?.transform;
        }
        
        if (sceneSettings.avatarRoot != null)
        {
            // Avatar-Position
            sceneSettings.avatarRoot.position = sceneSettings.avatarPosition;
            sceneSettings.avatarRoot.rotation = Quaternion.Euler(sceneSettings.avatarRotation);
            sceneSettings.avatarRoot.localScale = sceneSettings.avatarScale;
            
            // Avatar-Controller
            avatarController = sceneSettings.avatarRoot.GetComponent<KayaAvatarController>();
            if (avatarController == null)
            {
                avatarController = sceneSettings.avatarRoot.gameObject.AddComponent<KayaAvatarController>();
            }
        }
    }
    
    private void OptimizeForWebGL()
    {
        if (webglOptimizer != null)
        {
            webglOptimizer.OptimizeForWebGL();
        }
        
        // WebGL-spezifische Optimierungen
        QualitySettings.antiAliasing = 0; // Deaktiviert für Performance
        QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
        QualitySettings.masterTextureLimit = 1; // Halbe Textur-Auflösung
        
        // Shadow-Settings für WebGL
        QualitySettings.shadowResolution = ShadowResolution.Low;
        QualitySettings.shadowCascades = ShadowCascades.NoCascades;
        QualitySettings.shadowDistance = 20f; // Reduziert für WebGL
    }
    
    private void SetupLipSync()
    {
        if (lipSyncData != null && avatarController != null)
        {
            avatarController.lipSyncData = lipSyncData;
        }
    }
    
    private void UpdatePerformanceStats()
    {
        // Performance-Stats für Debug
        float fps = 1f / Time.unscaledDeltaTime;
        float memory = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false) / 1024f / 1024f;
        
        if (debugMode)
        {
            Debug.Log($"FPS: {fps:F1}, Memory: {memory:F1}MB");
        }
    }
    
    // Public Methods für Runtime-Anpassungen
    public void SetCameraPosition(Vector3 position)
    {
        sceneSettings.cameraOffset = position;
        SetupCamera();
    }
    
    public void SetAvatarPosition(Vector3 position)
    {
        sceneSettings.avatarPosition = position;
        SetupAvatar();
    }
    
    public void SetQualityLevel(int level)
    {
        sceneSettings.qualityLevel = level;
        QualitySettings.SetQualityLevel(level);
    }
    
    // Context Menu für Testing
    [ContextMenu("Test Scene Setup")]
    private void TestSceneSetup()
    {
        InitializeScene();
        SetupCamera();
        SetupLighting();
        SetupAvatar();
        Debug.Log("✅ Scene Setup Test completed");
    }
    
    [ContextMenu("Optimize for WebGL")]
    private void TestWebGLOptimization()
    {
        OptimizeForWebGL();
        Debug.Log("✅ WebGL Optimization Test completed");
    }
}

