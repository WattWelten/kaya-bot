using UnityEngine;
using UnityEditor;
using Cinemachine;
using System.Collections.Generic;

[System.Serializable]
public class AutoSetupConfig
{
    [Header("🎯 Auto Setup Configuration")]
    public bool autoSetupOnStart = true;
    public bool createSceneManager = true;
    public bool setupCamera = true;
    public bool setupLighting = true;
    public bool setupAvatar = true;
    public bool setupLipSync = true;
    public bool setupPerformance = true;
    public bool setupWebGL = true;
    
    [Header("🎭 Avatar Settings")]
    public Vector3 avatarPosition = Vector3.zero;
    public Vector3 avatarScale = Vector3.one;
    public Vector3 avatarRotation = Vector3.zero;
    
    [Header("🎥 Camera Settings")]
    public Vector3 cameraOffset = new Vector3(0, 1.6f, 2.5f);
    public Vector3 cameraRotation = new Vector3(15, 0, 0);
    public float fieldOfView = 60f;
    
    [Header("💡 Lighting Settings")]
    public Color ambientColor = new Color(0.2f, 0.2f, 0.2f, 1f);
    public float mainLightIntensity = 1.2f;
    public float fillLightIntensity = 0.4f;
    public float rimLightIntensity = 0.3f;
}

public class AutoSceneSetup : MonoBehaviour
{
    [Header("🚀 Auto Setup")]
    [Tooltip("Automatisches Setup-Konfiguration")]
    public AutoSetupConfig config;
    
    [Header("🔍 Found Components")]
    [Tooltip("Gefundene GLB-Modelle")]
    public List<GameObject> glbModels = new List<GameObject>();
    
    [Tooltip("Gefundene Kameras")]
    public List<Camera> cameras = new List<Camera>();
    
    [Tooltip("Gefundene Lichter")]
    public List<Light> lights = new List<Light>();
    
    [Header("📊 Setup Status")]
    [Tooltip("Setup-Status")]
    public bool isSetupComplete = false;
    
    [Tooltip("Setup-Fehler")]
    public List<string> setupErrors = new List<string>();
    
    void Start()
    {
        if (config.autoSetupOnStart)
        {
            StartCoroutine(AutoSetupCoroutine());
        }
    }
    
    [ContextMenu("🚀 Start Auto Setup")]
    public void StartAutoSetup()
    {
        StartCoroutine(AutoSetupCoroutine());
    }
    
    private System.Collections.IEnumerator AutoSetupCoroutine()
    {
        Debug.Log("🚀 Starting Auto Setup...");
        
        // Schritt 1: GLB-Modelle finden
        yield return StartCoroutine(FindGLBModels());
        
        // Schritt 2: Scene Manager erstellen
        if (config.createSceneManager)
        {
            yield return StartCoroutine(CreateSceneManager());
        }
        
        // Schritt 3: Kamera setup
        if (config.setupCamera)
        {
            yield return StartCoroutine(SetupCamera());
        }
        
        // Schritt 4: Lighting setup
        if (config.setupLighting)
        {
            yield return StartCoroutine(SetupLighting());
        }
        
        // Schritt 5: Avatar setup
        if (config.setupAvatar)
        {
            yield return StartCoroutine(SetupAvatar());
        }
        
        // Schritt 6: Lip-Sync setup
        if (config.setupLipSync)
        {
            yield return StartCoroutine(SetupLipSync());
        }
        
        // Schritt 7: Performance setup
        if (config.setupPerformance)
        {
            yield return StartCoroutine(SetupPerformance());
        }
        
        // Schritt 8: WebGL setup
        if (config.setupWebGL)
        {
            yield return StartCoroutine(SetupWebGL());
        }
        
        isSetupComplete = true;
        Debug.Log("✅ Auto Setup completed!");
        
        if (setupErrors.Count > 0)
        {
            Debug.LogWarning($"⚠️ Setup completed with {setupErrors.Count} warnings:");
            foreach (var error in setupErrors)
            {
                Debug.LogWarning($"- {error}");
            }
        }
    }
    
    private System.Collections.IEnumerator FindGLBModels()
    {
        Debug.Log("🔍 Finding GLB models...");
        
        // Alle GameObjects in der Scene durchsuchen
        var allObjects = FindObjectsOfType<GameObject>();
        
        foreach (var obj in allObjects)
        {
            // Nach GLB-Modellen suchen (haben meist SkinnedMeshRenderer)
            var skinnedMeshRenderer = obj.GetComponent<SkinnedMeshRenderer>();
            if (skinnedMeshRenderer != null)
            {
                glbModels.Add(obj);
                Debug.Log($"✅ Found GLB model: {obj.name}");
            }
        }
        
        if (glbModels.Count == 0)
        {
            setupErrors.Add("No GLB models found in scene");
        }
        
        yield return null;
    }
    
    private System.Collections.IEnumerator CreateSceneManager()
    {
        Debug.Log("🎬 Creating Scene Manager...");
        
        // Scene Manager GameObject erstellen
        GameObject sceneManagerGO = new GameObject("SceneManager");
        sceneManagerGO.transform.position = Vector3.zero;
        
        // AIAvatarSceneManager hinzufügen
        var sceneManager = sceneManagerGO.AddComponent<AIAvatarSceneManager>();
        
        // PerformanceOptimizer hinzufügen
        var performanceOptimizer = sceneManagerGO.AddComponent<PerformanceOptimizer>();
        
        // WebGLOptimizer hinzufügen
        var webglOptimizer = sceneManagerGO.AddComponent<WebGLOptimizer>();
        
        Debug.Log("✅ Scene Manager created");
        
        yield return null;
    }
    
    private System.Collections.IEnumerator SetupCamera()
    {
        Debug.Log("🎥 Setting up Camera...");
        
        // Haupt-Kamera finden
        var mainCamera = Camera.main;
        if (mainCamera == null)
        {
            mainCamera = FindObjectOfType<Camera>();
        }
        
        if (mainCamera != null)
        {
            cameras.Add(mainCamera);
            
            // Kamera-Einstellungen
            mainCamera.fieldOfView = config.fieldOfView;
            mainCamera.nearClipPlane = 0.1f;
            mainCamera.farClipPlane = 100f;
            
            // Cinemachine Virtual Camera erstellen
            GameObject vcamGO = new GameObject("CM vcam1");
            var virtualCamera = vcamGO.AddComponent<CinemachineVirtualCamera>();
            
            // Virtual Camera konfigurieren
            virtualCamera.m_Lens.FieldOfView = config.fieldOfView;
            virtualCamera.m_Lens.NearClipPlane = 0.1f;
            virtualCamera.m_Lens.FarClipPlane = 100f;
            
            // Follow Target setzen (wird später gesetzt)
            if (glbModels.Count > 0)
            {
                virtualCamera.Follow = glbModels[0].transform;
                virtualCamera.LookAt = glbModels[0].transform;
            }
            
            Debug.Log("✅ Camera setup completed");
        }
        else
        {
            setupErrors.Add("No camera found in scene");
        }
        
        yield return null;
    }
    
    private System.Collections.IEnumerator SetupLighting()
    {
        Debug.Log("💡 Setting up Lighting...");
        
        // Ambient Light
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
        RenderSettings.ambientSkyColor = config.ambientColor;
        RenderSettings.ambientEquatorColor = config.ambientColor * 0.8f;
        RenderSettings.ambientGroundColor = config.ambientColor * 0.6f;
        
        // Haupt-Licht finden oder erstellen
        var mainLight = FindObjectOfType<Light>();
        if (mainLight == null)
        {
            GameObject lightGO = new GameObject("Main Light");
            mainLight = lightGO.AddComponent<Light>();
        }
        
        mainLight.type = LightType.Directional;
        mainLight.color = Color.white;
        mainLight.intensity = config.mainLightIntensity;
        mainLight.shadows = LightShadows.Soft;
        mainLight.shadowStrength = 0.8f;
        mainLight.transform.rotation = Quaternion.Euler(45, 30, 0);
        
        lights.Add(mainLight);
        
        // Fill Light erstellen
        GameObject fillLightGO = new GameObject("Fill Light");
        var fillLight = fillLightGO.AddComponent<Light>();
        fillLight.type = LightType.Directional;
        fillLight.color = new Color(0.8f, 0.9f, 1f);
        fillLight.intensity = config.fillLightIntensity;
        fillLight.shadows = LightShadows.None;
        fillLight.transform.rotation = Quaternion.Euler(-30, -30, 0);
        
        lights.Add(fillLight);
        
        // Rim Light erstellen
        GameObject rimLightGO = new GameObject("Rim Light");
        var rimLight = rimLightGO.AddComponent<Light>();
        rimLight.type = LightType.Directional;
        rimLight.color = new Color(1f, 0.8f, 0.6f);
        rimLight.intensity = config.rimLightIntensity;
        rimLight.shadows = LightShadows.None;
        rimLight.transform.rotation = Quaternion.Euler(0, 180, 0);
        
        lights.Add(rimLight);
        
        Debug.Log("✅ Lighting setup completed");
        
        yield return null;
    }
    
    private System.Collections.IEnumerator SetupAvatar()
    {
        Debug.Log("🎭 Setting up Avatar...");
        
        foreach (var glbModel in glbModels)
        {
            // Avatar-Position
            glbModel.transform.position = config.avatarPosition;
            glbModel.transform.rotation = Quaternion.Euler(config.avatarRotation);
            glbModel.transform.localScale = config.avatarScale;
            
            // KayaAvatarController hinzufügen
            var avatarController = glbModel.GetComponent<KayaAvatarController>();
            if (avatarController == null)
            {
                avatarController = glbModel.AddComponent<KayaAvatarController>();
            }
            
            // GLBAnalyzer hinzufügen
            var glbAnalyzer = glbModel.GetComponent<GLBAnalyzer>();
            if (glbAnalyzer == null)
            {
                glbAnalyzer = glbModel.AddComponent<GLBAnalyzer>();
            }
            
            // GLB analysieren
            glbAnalyzer.AnalyzeGLB();
            
            // Avatar automatisch konfigurieren
            glbAnalyzer.ConfigureAvatar();
            
            Debug.Log($"✅ Avatar setup completed for {glbModel.name}");
        }
        
        yield return null;
    }
    
    private System.Collections.IEnumerator SetupLipSync()
    {
        Debug.Log("🗣️ Setting up Lip Sync...");
        
        foreach (var glbModel in glbModels)
        {
            // AdvancedLipSyncController hinzufügen
            var lipSyncController = glbModel.GetComponent<AdvancedLipSyncController>();
            if (lipSyncController == null)
            {
                lipSyncController = glbModel.AddComponent<AdvancedLipSyncController>();
            }
            
            // AudioSource hinzufügen
            var audioSource = glbModel.GetComponent<AudioSource>();
            if (audioSource == null)
            {
                audioSource = glbModel.AddComponent<AudioSource>();
            }
            
            Debug.Log($"✅ Lip Sync setup completed for {glbModel.name}");
        }
        
        yield return null;
    }
    
    private System.Collections.IEnumerator SetupPerformance()
    {
        Debug.Log("⚡ Setting up Performance...");
        
        // Performance-Settings anwenden
        Application.targetFrameRate = 60;
        QualitySettings.vSyncCount = 1;
        QualitySettings.SetQualityLevel(2);
        QualitySettings.shadowDistance = 20f;
        QualitySettings.lodBias = 1f;
        
        Debug.Log("✅ Performance setup completed");
        
        yield return null;
    }
    
    private System.Collections.IEnumerator SetupWebGL()
    {
        Debug.Log("🌐 Setting up WebGL...");
        
        // WebGL-spezifische Einstellungen
        QualitySettings.antiAliasing = 0;
        QualitySettings.anisotropicFiltering = AnisotropicFiltering.Disable;
        QualitySettings.masterTextureLimit = 1;
        QualitySettings.shadowResolution = ShadowResolution.Low;
        QualitySettings.shadowCascades = ShadowCascades.NoCascades;
        
        Debug.Log("✅ WebGL setup completed");
        
        yield return null;
    }
    
    [ContextMenu("🔍 Find All Components")]
    public void FindAllComponents()
    {
        glbModels.Clear();
        cameras.Clear();
        lights.Clear();
        
        var allObjects = FindObjectsOfType<GameObject>();
        
        foreach (var obj in allObjects)
        {
            var skinnedMeshRenderer = obj.GetComponent<SkinnedMeshRenderer>();
            if (skinnedMeshRenderer != null)
            {
                glbModels.Add(obj);
            }
            
            var camera = obj.GetComponent<Camera>();
            if (camera != null)
            {
                cameras.Add(camera);
            }
            
            var light = obj.GetComponent<Light>();
            if (light != null)
            {
                lights.Add(light);
            }
        }
        
        Debug.Log($"Found {glbModels.Count} GLB models, {cameras.Count} cameras, {lights.Count} lights");
    }
    
    [ContextMenu("🧹 Cleanup Scene")]
    public void CleanupScene()
    {
        // Temporäre Objekte entfernen
        var tempObjects = GameObject.FindGameObjectsWithTag("Untagged");
        foreach (var obj in tempObjects)
        {
            if (obj.name.Contains("Temp") || obj.name.Contains("temp"))
            {
                DestroyImmediate(obj);
            }
        }
        
        Debug.Log("✅ Scene cleanup completed");
    }
}
