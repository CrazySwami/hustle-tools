/**
 * WordPress Playground State Persistence with Supabase
 *
 * Allows saving/loading complete Playground snapshots to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (would normally use env vars)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any = null;

// Initialize Supabase if credentials available
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export interface PlaygroundSnapshot {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  created_at: string;
  wordpress_version?: string;
  php_version?: string;
  plugins?: string[]; // List of installed plugins
  themes?: string[]; // List of installed themes
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

/**
 * Export WordPress Playground state to ZIP blob
 * Uses the Playground client's export functionality
 */
export async function exportPlaygroundState(): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('Must be called in browser environment');
  }

  const playgroundClient = (window as any).playgroundClient;
  if (!playgroundClient) {
    throw new Error('Playground not running');
  }

  console.log('📦 Exporting Playground state...');

  // Method 1: Try using exportWPResources if available
  if (typeof playgroundClient.exportWPResources === 'function') {
    const resources = await playgroundClient.exportWPResources();
    return new Blob([resources], { type: 'application/zip' });
  }

  // Method 2: Try using export if available
  if (typeof playgroundClient.export === 'function') {
    const exportedData = await playgroundClient.export();
    return new Blob([exportedData], { type: 'application/zip' });
  }

  // Method 3: Manual export by reading filesystem
  // Export key directories and database
  const files: { [path: string]: Uint8Array } = {};

  // Export database
  try {
    const dbContent = await playgroundClient.readFileAsBuffer('/wordpress/wp-content/database/.ht.sqlite');
    files['wp-content/database/.ht.sqlite'] = dbContent;
  } catch (err) {
    console.warn('No SQLite database found');
  }

  // Export uploads directory (media)
  try {
    const uploadsFiles = await exportDirectory(playgroundClient, '/wordpress/wp-content/uploads');
    Object.assign(files, uploadsFiles);
  } catch (err) {
    console.warn('Failed to export uploads:', err);
  }

  // Export plugins
  try {
    const pluginsFiles = await exportDirectory(playgroundClient, '/wordpress/wp-content/plugins');
    Object.assign(files, pluginsFiles);
  } catch (err) {
    console.warn('Failed to export plugins:', err);
  }

  // Export themes
  try {
    const themesFiles = await exportDirectory(playgroundClient, '/wordpress/wp-content/themes');
    Object.assign(files, themesFiles);
  } catch (err) {
    console.warn('Failed to export themes:', err);
  }

  // Create ZIP from files
  const zip = await createZipFromFiles(files);
  return zip;
}

/**
 * Helper: Recursively export directory
 */
async function exportDirectory(client: any, path: string): Promise<{ [path: string]: Uint8Array }> {
  const files: { [path: string]: Uint8Array } = {};

  try {
    const entries = await client.listFiles(path);

    for (const entry of entries) {
      const fullPath = `${path}/${entry.name}`;

      if (entry.isDirectory) {
        // Recurse into subdirectory
        const subFiles = await exportDirectory(client, fullPath);
        Object.assign(files, subFiles);
      } else {
        // Read file
        const content = await client.readFileAsBuffer(fullPath);
        // Store with relative path (remove /wordpress prefix)
        const relativePath = fullPath.replace('/wordpress/', '');
        files[relativePath] = content;
      }
    }
  } catch (err) {
    console.warn(`Failed to export directory ${path}:`, err);
  }

  return files;
}

/**
 * Helper: Create ZIP from file map
 */
async function createZipFromFiles(files: { [path: string]: Uint8Array }): Promise<Blob> {
  // Use browser-native ZIP compression (requires JSZip or similar)
  // For now, return a simple tar-like format
  // In production, you'd use JSZip library

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  for (const [path, content] of Object.entries(files)) {
    // Simple format: [path length][path][content length][content]
    const pathBytes = encoder.encode(path);
    const pathLength = new Uint32Array([pathBytes.length]);
    const contentLength = new Uint32Array([content.length]);

    parts.push(new Uint8Array(pathLength.buffer));
    parts.push(pathBytes);
    parts.push(new Uint8Array(contentLength.buffer));
    parts.push(content);
  }

  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return new Blob([combined], { type: 'application/zip' });
}

/**
 * Save Playground snapshot to Supabase
 */
export async function saveSnapshotToSupabase(
  name: string,
  description?: string,
  userId?: string
): Promise<PlaygroundSnapshot> {
  if (!supabase) {
    throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (!userId) {
    // Try to get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated. Please sign in to save snapshots.');
    }
    userId = user.id;
  }

  console.log('💾 Saving Playground snapshot...');

  // 1. Export Playground state to ZIP
  const zipBlob = await exportPlaygroundState();
  const fileName = `${Date.now()}-${name.replace(/[^a-z0-9]/gi, '-')}.zip`;
  const filePath = `${userId}/${fileName}`;

  console.log(`📤 Uploading ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB to Supabase...`);

  // 2. Upload ZIP to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('playground-snapshots')
    .upload(filePath, zipBlob, {
      contentType: 'application/zip',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload snapshot: ${uploadError.message}`);
  }

  console.log('✅ Uploaded to storage');

  // 3. Get metadata about installed plugins/themes
  const metadata = await getPlaygroundMetadata();

  // 4. Save metadata to database
  const snapshot: Partial<PlaygroundSnapshot> = {
    user_id: userId,
    name,
    description,
    file_path: filePath,
    file_size: zipBlob.size,
    wordpress_version: metadata.wordpressVersion,
    php_version: metadata.phpVersion,
    plugins: metadata.plugins,
    themes: metadata.themes,
    created_at: new Date().toISOString(),
  };

  const { data: dbData, error: dbError } = await supabase
    .from('playground_snapshots')
    .insert(snapshot)
    .select()
    .single();

  if (dbError) {
    // Cleanup uploaded file if database insert fails
    await supabase.storage.from('playground-snapshots').remove([filePath]);
    throw new Error(`Failed to save snapshot metadata: ${dbError.message}`);
  }

  console.log('✅ Snapshot saved:', dbData.id);

  return dbData as PlaygroundSnapshot;
}

/**
 * Get metadata about current Playground instance
 */
async function getPlaygroundMetadata(): Promise<{
  wordpressVersion?: string;
  phpVersion?: string;
  plugins: string[];
  themes: string[];
}> {
  if (typeof window === 'undefined') {
    return { plugins: [], themes: [] };
  }

  const playgroundClient = (window as any).playgroundClient;
  if (!playgroundClient) {
    return { plugins: [], themes: [] };
  }

  try {
    // Get WordPress and PHP versions
    const phpCode = `<?php
      require_once '/wordpress/wp-load.php';

      global $wp_version;
      $php_version = PHP_VERSION;

      // Get installed plugins
      $plugins = get_plugins();
      $plugin_names = array_keys($plugins);

      // Get installed themes
      $themes = wp_get_themes();
      $theme_names = array_keys($themes);

      echo json_encode(array(
        'wordpress_version' => $wp_version,
        'php_version' => $php_version,
        'plugins' => $plugin_names,
        'themes' => $theme_names
      ));
    ?>`;

    const result = await playgroundClient.run({ code: phpCode });
    const data = JSON.parse(result.text);

    return {
      wordpressVersion: data.wordpress_version,
      phpVersion: data.php_version,
      plugins: data.plugins || [],
      themes: data.themes || [],
    };
  } catch (err) {
    console.warn('Failed to get Playground metadata:', err);
    return { plugins: [], themes: [] };
  }
}

/**
 * List user's saved snapshots from Supabase
 */
export async function listSnapshots(userId?: string): Promise<PlaygroundSnapshot[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('playground_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list snapshots: ${error.message}`);
  }

  return data as PlaygroundSnapshot[];
}

/**
 * Load snapshot from Supabase and restore to Playground
 */
export async function loadSnapshotFromSupabase(snapshotId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  console.log('📥 Loading snapshot:', snapshotId);

  // 1. Get snapshot metadata
  const { data: snapshot, error: dbError } = await supabase
    .from('playground_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (dbError || !snapshot) {
    throw new Error(`Snapshot not found: ${dbError?.message}`);
  }

  // 2. Download ZIP from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('playground-snapshots')
    .download(snapshot.file_path);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download snapshot: ${downloadError?.message}`);
  }

  console.log(`📥 Downloaded ${(fileData.size / 1024 / 1024).toFixed(2)} MB`);

  // 3. Import into Playground
  await importPlaygroundState(fileData);

  console.log('✅ Snapshot restored');
}

/**
 * Import ZIP blob into WordPress Playground
 */
export async function importPlaygroundState(zipBlob: Blob): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Must be called in browser environment');
  }

  const playgroundClient = (window as any).playgroundClient;
  if (!playgroundClient) {
    throw new Error('Playground not running');
  }

  console.log('📦 Importing Playground state...');

  // Method 1: Try using importWPResources if available
  if (typeof playgroundClient.importWPResources === 'function') {
    await playgroundClient.importWPResources(zipBlob);
    return;
  }

  // Method 2: Try using import if available
  if (typeof playgroundClient.import === 'function') {
    await playgroundClient.import(zipBlob);
    return;
  }

  // Method 3: Manual import
  // Extract files and write to filesystem
  const files = await extractZip(zipBlob);

  for (const [path, content] of Object.entries(files)) {
    const fullPath = `/wordpress/${path}`;
    await playgroundClient.writeFile(fullPath, content);
  }

  console.log('✅ Import complete');
}

/**
 * Helper: Extract files from ZIP
 */
async function extractZip(blob: Blob): Promise<{ [path: string]: Uint8Array }> {
  // Simple extraction for our custom format
  const buffer = await blob.arrayBuffer();
  const data = new Uint8Array(buffer);
  const files: { [path: string]: Uint8Array } = {};

  let offset = 0;
  const decoder = new TextDecoder();

  while (offset < data.length) {
    // Read path length
    const pathLength = new Uint32Array(data.slice(offset, offset + 4).buffer)[0];
    offset += 4;

    // Read path
    const pathBytes = data.slice(offset, offset + pathLength);
    const path = decoder.decode(pathBytes);
    offset += pathLength;

    // Read content length
    const contentLength = new Uint32Array(data.slice(offset, offset + 4).buffer)[0];
    offset += 4;

    // Read content
    const content = data.slice(offset, offset + contentLength);
    offset += contentLength;

    files[path] = content;
  }

  return files;
}

/**
 * Delete snapshot from Supabase
 */
export async function deleteSnapshot(snapshotId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // 1. Get snapshot to get file path
  const { data: snapshot, error: fetchError } = await supabase
    .from('playground_snapshots')
    .select('file_path')
    .eq('id', snapshotId)
    .single();

  if (fetchError || !snapshot) {
    throw new Error(`Snapshot not found: ${fetchError?.message}`);
  }

  // 2. Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('playground-snapshots')
    .remove([snapshot.file_path]);

  if (storageError) {
    console.warn('Failed to delete storage file:', storageError);
  }

  // 3. Delete database record
  const { error: dbError } = await supabase
    .from('playground_snapshots')
    .delete()
    .eq('id', snapshotId);

  if (dbError) {
    throw new Error(`Failed to delete snapshot: ${dbError.message}`);
  }

  console.log('✅ Snapshot deleted');
}
