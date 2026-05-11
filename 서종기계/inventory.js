const initialMachines = [
    {
        id: "1",
        name: "DOOSAN PUMA GT 2100",
        maker: "DOOSAN",
        model: "GT 2100",
        year: "2019",
        category: "cnc",
        status: "onsale",
        image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800",
        specs: [
            { label: "최대 가공경", value: "390 mm" },
            { label: "최대 가공길이", value: "562 mm" },
            { label: "척 사이즈", value: "8 inch" }
        ]
    }
];

const initialPosts = [
    {
        id: "1",
        title: "서종기계 홈페이지 리뉴얼 안내",
        author: "관리자",
        date: "2024-05-11",
        views: 125,
        content: "안녕하세요, 서종기계입니다. 고객님들께 더 나은 서비스를 제공하고자 홈페이지를 전면 리뉴얼하였습니다. 많은 이용 부탁드립니다."
    }
];

class InventoryManager {
    constructor() {
        this.machines = [];
        this.grid = document.getElementById('inventory-grid');
        this.categoryBtns = document.querySelectorAll('.filter-btn');
        this.searchInput = document.getElementById('machine-search');
        this.currentFilter = 'all';
        this.searchTerm = '';

        this.init();
    }

    async init() {
        await this.load();
        this.render();
        this.bindEvents();
    }

    async load() {
        if (window.db) {
            try {
                const snapshot = await window.db.collection('machines').get();
                this.machines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (this.machines.length === 0) this.machines = initialMachines;
            } catch (e) {
                console.error("Firestore Load Error:", e);
                this.machines = JSON.parse(localStorage.getItem('machines')) || initialMachines;
            }
        } else {
            this.machines = JSON.parse(localStorage.getItem('machines')) || initialMachines;
        }
    }

    bindEvents() {
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.render();
            });
        }
    }

    render() {
        if (!this.grid) return;
        const filtered = this.machines.filter(m => {
            const matchesCat = this.currentFilter === 'all' || m.category === this.currentFilter;
            const matchesSearch = (m.name || "").toLowerCase().includes(this.searchTerm) || 
                                (m.maker || "").toLowerCase().includes(this.searchTerm) ||
                                (m.model || "").toLowerCase().includes(this.searchTerm);
            return matchesCat && matchesSearch;
        });

        this.grid.innerHTML = filtered.map(m => `
            <div class="machine-card" onclick="window.inventoryManager.showDetail('${m.id}')">
                <div class="img-container">
                    <span class="status-tag status-${m.status}">${this.getStatusText(m.status)}</span>
                    <img src="${m.image}" alt="${m.name}" onerror="this.src='https://placehold.co/600x400/f8f9fa/111827?text=Machine+Image'">
                </div>
                <div class="card-content">
                    <div class="maker">${m.maker}</div>
                    <h3>${m.name}</h3>
                    <div class="card-info">
                        <span>${m.year}년식</span>
                        <span>모델: ${m.model}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const map = { onsale: '판매중', reserved: '예약중', sold: '판매완료' };
        return map[status] || status;
    }

    showDetail(id) {
        const machine = this.machines.find(m => String(m.id) === String(id));
        if (!machine) return;

        const body = document.getElementById('modal-body');
        body.innerHTML = `
            <div class="detail-grid">
                <div>
                    <img src="${machine.image}" class="detail-img" alt="${machine.name}">
                    <div class="quick-inquiry">
                        <h4>기계 문의 요청</h4>
                        <p>해당 기종에 대해 궁금하신 점을 상담해드립니다.</p>
                        <button class="btn-primary w-full" style="margin-top:20px" onclick="window.showPage('#contact'); document.querySelector('.modal').classList.remove('active')">지금 바로 문의하기</button>
                    </div>
                </div>
                <div>
                    <h2 style="font-size:32px; margin-bottom:20px;">${machine.name}</h2>
                    <div style="margin-bottom: 20px;">
                        ${localStorage.getItem('isAdmin') === 'true' ? `<button class="btn-outline" style="color: red; border-color: rgba(255,0,0,0.2);" onclick="window.inventoryManager.deleteMachine('${machine.id}')">매물 삭제 (관리자)</button>` : ''}
                    </div>
                    <table class="specs-table">
                        <tr><th>제조사</th><td>${machine.maker}</td></tr>
                        <tr><th>모델명</th><td>${machine.model}</td></tr>
                        <tr><th>제조년도</th><td>${machine.year}</td></tr>
                        <tr><th>상태</th><td>${this.getStatusText(machine.status)}</td></tr>
                        ${(machine.specs || []).map(s => `<tr><th>${s.label}</th><td>${s.value}</td></tr>`).join('')}
                    </table>
                </div>
            </div>
        `;
        document.getElementById('detail-modal').classList.add('active');
    }

    async addMachine(data) {
        if (localStorage.getItem('isAdmin') !== 'true') return alert('권한이 없습니다.');
        
        const specs = data.specs ? data.specs.split('\n').filter(s => s.includes(':')).map(s => {
            const [label, value] = s.split(':');
            return { label: label.trim(), value: value.trim() };
        }) : [];

        const newMachine = { ...data, specs, createdAt: Date.now() };

        if (window.db) {
            const docRef = await window.db.collection('machines').add(newMachine);
            this.machines.unshift({ id: docRef.id, ...newMachine });
        } else {
            const id = Date.now().toString();
            this.machines.unshift({ id, ...newMachine });
            localStorage.setItem('machines', JSON.stringify(this.machines));
        }
        this.render();
    }

    async deleteMachine(id) {
        if (!confirm('정말 이 매물을 삭제하시겠습니까?')) return;
        if (window.db) {
            await window.db.collection('machines').doc(id).delete();
        }
        this.machines = this.machines.filter(m => String(m.id) !== String(id));
        localStorage.setItem('machines', JSON.stringify(this.machines));
        this.render();
        document.querySelector('.modal').classList.remove('active');
    }
}

class BoardManager {
    constructor() {
        this.posts = [];
        this.listElement = document.getElementById('board-list');
        this.init();
    }

    async init() {
        await this.load();
        this.render();
    }

    async load() {
        if (window.db) {
            const snapshot = await window.db.collection('posts').orderBy('date', 'desc').get();
            this.posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (this.posts.length === 0) this.posts = initialPosts;
        } else {
            this.posts = JSON.parse(localStorage.getItem('posts')) || initialPosts;
        }
    }

    render() {
        if (!this.listElement) return;
        this.listElement.innerHTML = this.posts.map((p, idx) => `
            <tr onclick="window.boardManager.showPost('${p.id}')">
                <td>${this.posts.length - idx}</td>
                <td style="font-weight:600;">${p.title}</td>
                <td>${p.date}</td>
                <td>${p.views || 0}</td>
            </tr>
        `).join('');
    }

    async showPost(id) {
        const post = this.posts.find(p => String(p.id) === String(id));
        if (!post) return;
        
        // Update views
        post.views = (post.views || 0) + 1;
        if (window.db) {
            window.db.collection('posts').doc(id).update({ views: post.views });
        }
        localStorage.setItem('posts', JSON.stringify(this.posts));
        this.render();

        // Comments
        let comments = [];
        if (window.db) {
            const snap = await window.db.collection('posts').doc(id).collection('comments').orderBy('timestamp', 'asc').get();
            comments = snap.docs.map(d => d.data());
        } else {
            comments = JSON.parse(localStorage.getItem(`comments_${id}`)) || [];
        }

        const body = document.getElementById('modal-body');
        body.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="font-size:28px; margin-bottom:10px;">${post.title}</h2>
                <div style="color:var(--text-dim); margin-bottom:30px; padding-bottom:20px; border-bottom:1px solid var(--border);">
                    작성자: ${post.author} | 날짜: ${post.date} | 조회: ${post.views}
                </div>
                <div style="line-height:1.8; font-size:16px; min-height: 200px; white-space:pre-wrap;">${post.content}</div>
                
                <div class="comments-section" style="margin-top: 50px; border-top: 1px solid var(--border); padding-top: 30px;">
                    <h4 style="margin-bottom: 20px;">답글 (${comments.length})</h4>
                    <div id="comment-list" style="margin-bottom: 30px;">
                        ${comments.map(c => `
                            <div style="padding: 15px; background: var(--light-bg); border-radius: 8px; margin-bottom: 10px;">
                                <div style="font-weight: 700; font-size: 14px; margin-bottom: 5px;">${c.author} <span style="font-weight: 400; color: var(--text-dim); font-size: 12px;">${c.date}</span></div>
                                <div style="font-size: 14px;">${c.content}</div>
                            </div>
                        `).join('') || '<p style="color: var(--text-dim); font-size: 14px;">첫 답글을 남겨보세요.</p>'}
                    </div>
                    
                    <form id="comment-form" onsubmit="window.boardManager.addComment(event, '${id}')">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="comment-author" placeholder="이름" required style="width: 100px; padding: 10px; border: 1px solid var(--border); border-radius: 6px;">
                            <input type="text" id="comment-content" placeholder="답글 내용을 입력하세요" required style="flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: 6px;">
                            <button type="submit" class="btn-primary" style="padding: 10px 20px;">공개</button>
                        </div>
                    </form>
                </div>

                <div style="margin-top: 40px; display: flex; gap: 10px;">
                    <button class="btn-outline" onclick="document.querySelector('.modal').classList.remove('active')">목록으로</button>
                    ${localStorage.getItem('isAdmin') === 'true' ? `<button class="btn-outline" style="color: red; border-color: rgba(255,0,0,0.2);" onclick="window.boardManager.deletePost('${id}')">삭제 (관리자)</button>` : ''}
                </div>
            </div>
        `;
        document.getElementById('detail-modal').classList.add('active');
    }

    async addComment(e, postId) {
        e.preventDefault();
        const author = document.getElementById('comment-author').value;
        const content = document.getElementById('comment-content').value;
        
        const comment = {
            author,
            content,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        if (window.db) {
            await window.db.collection('posts').doc(postId).collection('comments').add(comment);
        } else {
            const comments = JSON.parse(localStorage.getItem(`comments_${postId}`)) || [];
            comments.push(comment);
            localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
        }
        
        this.showPost(postId);
    }

    async addPost(data) {
        if (localStorage.getItem('isAdmin') !== 'true') return alert('권한이 없습니다.');
        const newPost = { ...data, createdAt: Date.now() };

        if (window.db) {
            const docRef = await window.db.collection('posts').add(newPost);
            this.posts.unshift({ id: docRef.id, ...newPost });
        } else {
            const id = Date.now().toString();
            this.posts.unshift({ id, ...newPost });
            localStorage.setItem('posts', JSON.stringify(this.posts));
        }
        this.render();
    }

    async deletePost(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        if (window.db) {
            await window.db.collection('posts').doc(id).delete();
        }
        this.posts = this.posts.filter(p => String(p.id) !== String(id));
        localStorage.setItem('posts', JSON.stringify(this.posts));
        this.render();
        document.querySelector('.modal').classList.remove('active');
    }
}

window.inventoryManager = new InventoryManager();
window.boardManager = new BoardManager();
