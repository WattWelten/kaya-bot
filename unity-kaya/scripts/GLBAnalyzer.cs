using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using System.Linq;

[System.Serializable]
public class GLBAnalysisData
{
    [Header("📊 GLB Analysis Results")]
    public string fileName;
    public long fileSizeBytes;
    public int meshCount;
    public int materialCount;
    public int textureCount;
    public int animationCount;
    public int blendShapeCount;
    public bool hasRigging;
    public string riggingType;
    public List<string> meshNames = new List<string>();
    public List<string> materialNames = new List<string>();
    public List<string> animationNames = new List<string>();
    public List<string> blendShapeNames = new List<string>();
}

public class GLBAnalyzer : MonoBehaviour
{
    [Header("🔍 GLB Analysis")]
    [Tooltip("GLB-Datei für Analyse")]
    public GameObject glbModel;
    
    [Tooltip("Analyse-Ergebnisse")]
    public GLBAnalysisData analysisData;
    
    [Header("🎯 Avatar Setup")]
    [Tooltip("Avatar-Controller")]
    public KayaAvatarController avatarController;
    
    [Tooltip("Automatische Konfiguration")]
    public bool autoConfigure = true;
    
    void Start()
    {
        if (glbModel != null)
        {
            AnalyzeGLB();
            if (autoConfigure)
            {
                ConfigureAvatar();
            }
        }
    }
    
    [ContextMenu("Analyze GLB")]
    public void AnalyzeGLB()
    {
        if (glbModel == null)
        {
            Debug.LogError("Kein GLB-Modell zugewiesen!");
            return;
        }
        
        analysisData = new GLBAnalysisData();
        analysisData.fileName = glbModel.name;
        
        // Mesh-Analyse
        AnalyzeMeshes();
        
        // Material-Analyse
        AnalyzeMaterials();
        
        // Animation-Analyse
        AnalyzeAnimations();
        
        // Blend-Shape-Analyse
        AnalyzeBlendShapes();
        
        // Rigging-Analyse
        AnalyzeRigging();
        
        Debug.Log($"✅ GLB-Analyse abgeschlossen: {analysisData.meshCount} Meshes, {analysisData.materialCount} Materials, {analysisData.animationCount} Animationen, {analysisData.blendShapeCount} Blend Shapes");
    }
    
    private void AnalyzeMeshes()
    {
        var meshRenderers = glbModel.GetComponentsInChildren<SkinnedMeshRenderer>();
        var meshFilters = glbModel.GetComponentsInChildren<MeshFilter>();
        
        analysisData.meshCount = meshRenderers.Length + meshFilters.Length;
        
        foreach (var renderer in meshRenderers)
        {
            analysisData.meshNames.Add(renderer.name);
        }
        
        foreach (var filter in meshFilters)
        {
            analysisData.meshNames.Add(filter.name);
        }
    }
    
    private void AnalyzeMaterials()
    {
        var renderers = glbModel.GetComponentsInChildren<Renderer>();
        var materials = new HashSet<Material>();
        
        foreach (var renderer in renderers)
        {
            foreach (var material in renderer.materials)
            {
                materials.Add(material);
                analysisData.materialNames.Add(material.name);
            }
        }
        
        analysisData.materialCount = materials.Count;
    }
    
    private void AnalyzeAnimations()
    {
        var animator = glbModel.GetComponent<Animator>();
        if (animator != null && animator.runtimeAnimatorController != null)
        {
            var clips = animator.runtimeAnimatorController.animationClips;
            analysisData.animationCount = clips.Length;
            
            foreach (var clip in clips)
            {
                analysisData.animationNames.Add(clip.name);
            }
        }
    }
    
    private void AnalyzeBlendShapes()
    {
        var skinnedMeshRenderers = glbModel.GetComponentsInChildren<SkinnedMeshRenderer>();
        
        foreach (var renderer in skinnedMeshRenderers)
        {
            if (renderer.sharedMesh != null)
            {
                int blendShapeCount = renderer.sharedMesh.blendShapeCount;
                analysisData.blendShapeCount += blendShapeCount;
                
                for (int i = 0; i < blendShapeCount; i++)
                {
                    string blendShapeName = renderer.sharedMesh.GetBlendShapeName(i);
                    analysisData.blendShapeNames.Add(blendShapeName);
                }
            }
        }
    }
    
    private void AnalyzeRigging()
    {
        var animator = glbModel.GetComponent<Animator>();
        if (animator != null)
        {
            analysisData.hasRigging = true;
            
            if (animator.isHuman)
            {
                analysisData.riggingType = "Humanoid";
            }
            else
            {
                analysisData.riggingType = "Generic";
            }
        }
        else
        {
            analysisData.hasRigging = false;
            analysisData.riggingType = "None";
        }
    }
    
    [ContextMenu("Configure Avatar")]
    public void ConfigureAvatar()
    {
        if (avatarController == null)
        {
            avatarController = glbModel.GetComponent<KayaAvatarController>();
            if (avatarController == null)
            {
                avatarController = glbModel.AddComponent<KayaAvatarController>();
            }
        }
        
        // Automatische Konfiguration basierend auf GLB-Analyse
        ConfigureAvatarComponents();
        ConfigureEmotions();
        ConfigureAnimations();
        ConfigureBlendShapes();
        
        Debug.Log("✅ Avatar automatisch konfiguriert!");
    }
    
    private void ConfigureAvatarComponents()
    {
        // Animator finden
        var animator = glbModel.GetComponent<Animator>();
        if (animator != null)
        {
            avatarController.avatarAnimator = animator;
        }
        
        // SkinnedMeshRenderer finden
        var skinnedMeshRenderer = glbModel.GetComponent<SkinnedMeshRenderer>();
        if (skinnedMeshRenderer != null)
        {
            avatarController.avatarRenderer = skinnedMeshRenderer;
            avatarController.faceRenderer = skinnedMeshRenderer; // Fallback
        }
        
        // AudioSource hinzufügen
        var audioSource = glbModel.GetComponent<AudioSource>();
        if (audioSource == null)
        {
            audioSource = glbModel.AddComponent<AudioSource>();
        }
        avatarController.audioSource = audioSource;
    }
    
    private void ConfigureEmotions()
    {
        // Standard-Emotionen erstellen
        var emotions = new List<EmotionData>();
        
        // Neutral
        emotions.Add(new EmotionData
        {
            emotionName = "Neutral",
            intensity = 1.0f,
            emotionColor = Color.white
        });
        
        // Happy
        emotions.Add(new EmotionData
        {
            emotionName = "Happy",
            intensity = 1.0f,
            emotionColor = Color.yellow
        });
        
        // Sad
        emotions.Add(new EmotionData
        {
            emotionName = "Sad",
            intensity = 1.0f,
            emotionColor = Color.blue
        });
        
        avatarController.emotions = emotions.ToArray();
    }
    
    private void ConfigureAnimations()
    {
        var animator = glbModel.GetComponent<Animator>();
        if (animator != null && animator.runtimeAnimatorController != null)
        {
            var clips = animator.runtimeAnimatorController.animationClips;
            
            // Idle-Animation finden
            var idleClip = clips.FirstOrDefault(c => c.name.ToLower().Contains("idle"));
            if (idleClip != null)
            {
                avatarController.idleAnimation = idleClip;
            }
            
            // Speaking-Animation finden
            var speakingClip = clips.FirstOrDefault(c => c.name.ToLower().Contains("speak"));
            if (speakingClip != null)
            {
                avatarController.speakingAnimation = speakingClip;
            }
        }
    }
    
    private void ConfigureBlendShapes()
    {
        var skinnedMeshRenderer = glbModel.GetComponent<SkinnedMeshRenderer>();
        if (skinnedMeshRenderer != null && skinnedMeshRenderer.sharedMesh != null)
        {
            var lipSyncData = new LipSyncData();
            var mouthBlendShapes = new List<int>();
            
            // Mund-Blend-Shapes finden
            for (int i = 0; i < skinnedMeshRenderer.sharedMesh.blendShapeCount; i++)
            {
                string blendShapeName = skinnedMeshRenderer.sharedMesh.GetBlendShapeName(i).ToLower();
                
                if (blendShapeName.Contains("mouth") || blendShapeName.Contains("lip") || 
                    blendShapeName.Contains("jaw") || blendShapeName.Contains("speak"))
                {
                    mouthBlendShapes.Add(i);
                }
            }
            
            lipSyncData.mouthBlendShapes = mouthBlendShapes.ToArray();
            lipSyncData.sensitivity = 1.0f;
            lipSyncData.smoothing = 0.1f;
            
            avatarController.lipSyncData = lipSyncData;
        }
    }
    
    [ContextMenu("Export Analysis Report")]
    public void ExportAnalysisReport()
    {
        string report = $"GLB Analysis Report\n" +
                       $"==================\n" +
                       $"File: {analysisData.fileName}\n" +
                       $"Meshes: {analysisData.meshCount}\n" +
                       $"Materials: {analysisData.materialCount}\n" +
                       $"Animations: {analysisData.animationCount}\n" +
                       $"Blend Shapes: {analysisData.blendShapeCount}\n" +
                       $"Rigging: {analysisData.riggingType}\n\n" +
                       $"Meshes:\n{string.Join("\n", analysisData.meshNames)}\n\n" +
                       $"Materials:\n{string.Join("\n", analysisData.materialNames)}\n\n" +
                       $"Animations:\n{string.Join("\n", analysisData.animationNames)}\n\n" +
                       $"Blend Shapes:\n{string.Join("\n", analysisData.blendShapeNames)}";
        
        Debug.Log(report);
    }
}

