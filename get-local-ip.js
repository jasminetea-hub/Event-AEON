// ローカルIPアドレスを取得するスクリプト
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4で、内部アドレス（loopback）でないもの
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address
        });
      }
    }
  }

  return addresses;
}

const ips = getLocalIP();
console.log('\n🌐 ローカルネットワークIPアドレス:\n');
if (ips.length > 0) {
  ips.forEach(ip => {
    console.log(`   ${ip.interface}: ${ip.address}`);
    console.log(`   フロントエンド: http://${ip.address}:3000`);
    console.log(`   バックエンドAPI: http://${ip.address}:3001\n`);
  });
} else {
  console.log('   IPアドレスが見つかりませんでした');
}

// 最も一般的なWi-Fiインターフェースを優先
const wifiIP = ips.find(ip => 
  ip.interface.toLowerCase().includes('wifi') || 
  ip.interface.toLowerCase().includes('en0') ||
  ip.interface.toLowerCase().includes('en1')
) || ips[0];

if (wifiIP) {
  console.log('📱 スマホで以下のURLにアクセスしてください:');
  console.log(`   http://${wifiIP.address}:3000\n`);
}
