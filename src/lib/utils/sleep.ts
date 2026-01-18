export async function sleep(miliseconds = 1_000): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, miliseconds));
}
