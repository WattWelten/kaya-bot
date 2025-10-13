using UnityEngine;
using UnityEditor;
using System.IO;

public class AutoGLBImporter : AssetPostprocessor
{
    static void OnPostprocessAllAssets(string[] importedAssets, string[] deletedAssets, string[] movedAssets, string[] movedFromAssetPaths)
    {
        foreach (string assetPath in importedAssets)
        {
            if (assetPath.EndsWith(".glb"))
            {
                Debug.Log($"🎭 GLB file imported: {assetPath}");
                
                // GLB-Modell automatisch in Scene laden
                LoadGLBInScene(assetPath);
            }
        }
    }
    
    private static void LoadGLBInScene(string assetPath)
    {
        // GLB-Asset laden
        GameObject glbAsset = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
        
        if (glbAsset != null)
        {
            // GLB-Modell in Scene instanziieren
            GameObject glbInstance = PrefabUtility.InstantiatePrefab(glbAsset) as GameObject;
            
            if (glbInstance != null)
            {
                // Position setzen
                glbInstance.transform.position = Vector3.zero;
                glbInstance.transform.rotation = Quaternion.identity;
                glbInstance.transform.localScale = Vector3.one;
                
                // Name setzen
                glbInstance.name = "KayaAvatar";
                
                // AutoSceneSetup starten
                StartAutoSetup();
                
                Debug.Log($"✅ GLB model loaded in scene: {glbInstance.name}");
            }
        }
    }
    
    private static void StartAutoSetup()
    {
        // AutoSceneSetup GameObject erstellen
        GameObject autoSetupGO = new GameObject("AutoSceneSetup");
        var autoSetup = autoSetupGO.AddComponent<AutoSceneSetup>();
        
        // Auto Setup starten
        autoSetup.StartAutoSetup();
        
        Debug.Log("🚀 Auto Setup started for GLB model!");
    }
}

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
