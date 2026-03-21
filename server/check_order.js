import axios from 'axios';

async function checkUserOrder() {
  try {
    const res = await axios.get('http://localhost:5000/api/users?pageSize=50');
    const users = res.data.data;
    console.log('当前用户顺序:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, 姓名: ${u.name}, 性别: ${u.gender}`);
    });
    
    // 检查是否按性别聚合
    let lastGender = null;
    let genderSwitches = 0;
    users.forEach(u => {
      if (lastGender && u.gender !== lastGender) {
        genderSwitches++;
      }
      lastGender = u.gender;
    });
    
    console.log(`\n性别切换次数: ${genderSwitches}`);
    if (genderSwitches < 5) {
      console.log('结论: 数据确实表现出按性别聚集的趋势。');
    } else {
      console.log('结论: 性别分布较为随机。');
    }

    // 检查 ID 是否有序
    let idUnordered = false;
    for (let i = 1; i < users.length; i++) {
      if (users[i].id < users[i-1].id) {
        idUnordered = true;
        break;
      }
    }
    console.log(`ID 是否乱序: ${idUnordered}`);

  } catch (err) {
    console.error('请求失败:', err.message);
  }
}

checkUserOrder();
