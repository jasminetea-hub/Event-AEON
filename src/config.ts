// APIサーバーのURLを取得する関数
// 環境変数が設定されている場合はそれを使用、なければlocalStorageの値、それもなければデフォルト値を使用
export const getApiBaseUrl = () => {
  // 環境変数が設定されている場合は優先
  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  
  // localStorageに保存されている値がある場合はそれを使用
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('apiBaseUrl');
    if (savedUrl) {
      return savedUrl;
    }
    
    // 保存されていない場合は、現在のホスト名から推測
    const hostname = window.location.hostname;
    // localhostまたは127.0.0.1の場合は、同じ端末を想定
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // それ以外の場合は、同じホスト名でポート3001にアクセス
    // スマホでPCのIPアドレスにアクセスしている場合は、PCのIPアドレスを使用
    return `http://${hostname}:3001`;
  }
  
  // サーバーサイドレンダリング時のフォールバック
  return 'http://localhost:3001';
};

// APIサーバーのURLを設定する関数（動的に変更可能）
export const setApiBaseUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('apiBaseUrl', url);
    window.location.reload(); // 設定を反映するためにリロード
  }
};

// デフォルトのAPIベースURL（後方互換性のため）
export const API_BASE_URL = getApiBaseUrl();
