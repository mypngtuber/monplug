/**
 * Material Manager for AstraCut
 * 
 * Rules:
 * - Local inventory of project items (video, image, music, sfx, b-roll, overlay, graphics, fonts, logos).
 * - Compares Edit Plan needs against inventory.
 * - Missing items trigger dedicated Material Cards with user actions:
 *   [Choose From Project] [Choose From Device] [Search in Browser] [Skip]
 * - Google Search Query Builder: generates optimized query and opens in browser.
 * - Explicit warning that "royalty-free" does not automatically guarantee full commercial rights.
 * - Music prompt generator for external music tools.
 */

export class MaterialManager {
  constructor(initialMaterials = []) {
    this.materials = initialMaterials.length > 0 ? initialMaterials : this._getDefaultMaterials();
  }

  _getDefaultMaterials() {
    return [
      {
        id: "mat_vid_01",
        name: "Interview_Clip_A01.mov",
        type: "video",
        duration: 23.9,
        resolution: "1920x1080",
        fps: 29.97,
        path: "/Volumes/Projects/Interview/Clips/Interview_Clip_A01.mov",
        inUse: true,
        tags: ["interview", "speaker_1", "talking_head"]
      },
      {
        id: "mat_broll_01",
        name: "Code_Screen_4K.mp4",
        type: "broll",
        duration: 12.0,
        resolution: "3840x2160",
        fps: 29.97,
        path: "/Volumes/Projects/Interview/Broll/Code_Screen_4K.mp4",
        inUse: false,
        tags: ["technology", "coding", "screen"]
      },
      {
        id: "mat_logo_01",
        name: "Brand_Logo_White.png",
        type: "logos",
        resolution: "1024x1024",
        path: "/Volumes/Projects/Interview/Graphics/Brand_Logo_White.png",
        inUse: false,
        tags: ["logo", "branding"]
      },
      {
        id: "mat_font_01",
        name: "Montserrat-Black.ttf",
        type: "fonts",
        path: "/Volumes/Projects/Interview/Fonts/Montserrat-Black.ttf",
        inUse: true,
        tags: ["caption", "typography"]
      }
    ];
  }

  getAll() {
    return this.materials;
  }

  getByType(type) {
    return this.materials.filter(m => m.type.toLowerCase() === type.toLowerCase());
  }

  addMaterial(mat) {
    const newMat = {
      id: mat.id || `mat_${Date.now()}`,
      name: mat.name || "Untitled Material",
      type: mat.type || "broll",
      path: mat.path || "",
      duration: mat.duration || 0,
      resolution: mat.resolution || "1920x1080",
      inUse: false,
      tags: mat.tags || []
    };
    this.materials.push(newMat);
    return newMat;
  }

  removeMaterial(id) {
    this.materials = this.materials.filter(m => m.id !== id);
    return true;
  }

  /**
   * Compares edit plan requirements with materials in inventory
   * Generates Missing Material Cards
   */
  findMissingMaterials(editPlan) {
    const missing = [];

    // Check SFX requirements
    for (const sfx of (editPlan.soundEffects || [])) {
      const match = this.materials.find(m => 
        m.type === 'sfx' && (
          m.name.toLowerCase().includes(sfx.type.toLowerCase()) || 
          m.tags?.some(t => t.toLowerCase() === sfx.type.toLowerCase())
        )
      );

      if (match) {
        sfx.matchedMaterialId = match.id;
      } else {
        missing.push({
          id: `req_sfx_${sfx.id || Math.random().toString(36).substr(2, 5)}`,
          type: 'sfx',
          name: sfx.name || `${sfx.type.toUpperCase()} Sound Effect`,
          start: sfx.start,
          duration: sfx.duration || 0.8,
          reason: sfx.reason || 'Audio punctuation & transition accent',
          priority: 'medium',
          searchQuery: `${sfx.type} sound effect royalty free`,
          suggestedQueryUrl: `https://www.google.com/search?q=${encodeURIComponent(sfx.type + ' sound effect royalty free')}`
        });
      }
    }

    // Check B-roll requirements
    for (const broll of (editPlan.brollRequests || [])) {
      const match = this.materials.find(m => 
        m.type === 'broll' && (
          m.name.toLowerCase().includes(broll.name?.toLowerCase() || '') ||
          broll.description.toLowerCase().split(' ').some(w => w.length > 3 && m.tags?.includes(w))
        )
      );

      if (match) {
        broll.matchedMaterialId = match.id;
      } else {
        missing.push({
          id: `req_broll_${broll.id || Math.random().toString(36).substr(2, 5)}`,
          type: 'broll',
          name: broll.name || 'Visual B-roll Footage',
          start: broll.start,
          end: broll.end,
          duration: broll.duration || (broll.end - broll.start),
          reason: broll.reason || 'Visual support for speech context',
          priority: broll.priority || 'high',
          searchQuery: `${broll.name || 'b-roll footage'} cinematic 4k royalty free`,
          suggestedQueryUrl: `https://www.google.com/search?q=${encodeURIComponent((broll.name || 'b-roll footage') + ' cinematic 4k royalty free')}`
        });
      }
    }

    // Check Music
    if (editPlan.musicPlan && !editPlan.musicPlan.matchedMaterialId) {
      const musicMat = this.materials.find(m => m.type === 'music');
      if (musicMat) {
        editPlan.musicPlan.matchedMaterialId = musicMat.id;
      } else {
        missing.push({
          id: 'req_music_01',
          type: 'music',
          name: 'Background Music Bed',
          start: 0,
          duration: editPlan.target_duration || 30,
          reason: 'Continuous ambient emotional momentum under dialogue',
          priority: 'high',
          musicPrompt: editPlan.musicPlan.recommendedPrompt,
          searchQuery: `upbeat modern tech instrumental background music royalty free`,
          suggestedQueryUrl: `https://www.google.com/search?q=${encodeURIComponent('upbeat modern tech instrumental background music royalty free')}`
        });
      }
    }

    return missing;
  }
}
