export async function clearTokens() {

}

export async function getAuthHeaders(): Promise<{ Authorization: string }> {
  return {
    Authorization: `Bearer`,
  };
}
