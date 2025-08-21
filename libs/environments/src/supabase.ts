/**
 * Asynchronously load supabase dev environment from local config file
 * This enables any developers to provide their own local anonKey by creating a
 * `config.json` file in the local `supabase` environment folder
 *
 * https://stackoverflow.com/a/47956054/5693245
 *
 * It will be automatically populated when running locally with db seed
 *
 * ```sh
 * yarn nx run picsa-server:seed
 * ```
 * */
export async function loadSupabaseConfig() {
  // Use a variable filename so that compiler bundles all files in folder
  // regardless of whether specific config file exists or not
  const filename = 'config.json';
  // use try-catch (web) and promise catch (node)
  try {
    const res = await import(`./supabase/${filename}`);
    return res.default;
  } catch (error) {
    return undefined;
  }
}
