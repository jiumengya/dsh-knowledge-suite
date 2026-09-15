// 递归复制目录：本沙箱 fs.cpSync 静默失效，用 readdir+mkdir+copyFile 手工实现。
import fs from 'node:fs'
import path from 'node:path'

/** 递归复制 src -> dst（dst 若已存在则先清空）。 */
export function copyDir(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true })
  fs.mkdirSync(dst, { recursive: true })
  let files = 0
  let bytes = 0
  const walk = (s, d) => {
    for (const ent of fs.readdirSync(s, { withFileTypes: true })) {
      const sp = path.join(s, ent.name)
      const dp = path.join(d, ent.name)
      if (ent.isDirectory()) {
        fs.mkdirSync(dp, { recursive: true })
        walk(sp, dp)
      } else if (ent.isSymbolicLink()) {
        fs.symlinkSync(fs.readlinkSync(sp), dp)
        files++
      } else {
        fs.copyFileSync(sp, dp)
        files++
        bytes += fs.statSync(dp).size
      }
    }
  }
  walk(src, dst)
  return { files, bytes }
}

if (process.argv[1] && process.argv[1].endsWith('copy-tree.mjs') && process.argv[2] === 'seed') {
  const RT = 'C:/Users/jiuyu/AppData/Local/DshNative/runtime/node_modules/@deepseek-ai'
  const DST = 'D:/项目/dsh-native/plugins/dsh-knowledge-suite/pkg'
  const PKGS = [
    'dsh-knowledge',
    'dsh-knowledge-store',
    'dsh-tool-knowledge',
    'dsh-knowledge-recall',
    'dsh-api-knowledge-controller',
    'dsh-client-ui-knowledge',
  ]
  let tf = 0
  let tb = 0
  for (const p of PKGS) {
    const r = copyDir(path.join(RT, p), path.join(DST, p))
    tf += r.files
    tb += r.bytes
    console.log(`  seeded ${p}: ${r.files} files, ${(r.bytes / 1024).toFixed(1)} KB`)
  }
  console.log(`pkg/ 共 ${tf} 文件, ${(tb / 1024).toFixed(1)} KB`)
}
