import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Generator

DATABASE_PATH = Path(__file__).parent.parent.parent / "data" / "xianyu.db"


def get_db_connection() -> sqlite3.Connection:
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """数据库连接上下文管理器"""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """初始化数据库表"""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with get_db() as conn:
        cursor = conn.cursor()

        # 创建历史记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                buyer_message TEXT NOT NULL,
                detected_type_name TEXT,
                confidence REAL DEFAULT 0,
                extracted_info TEXT,
                missing_info TEXT,
                suggested_reply TEXT NOT NULL,
                price_min INTEGER DEFAULT 0,
                price_max INTEGER DEFAULT 0,
                price_basis TEXT,
                article_type TEXT,
                deal_status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 创建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_history_created_at
            ON history_records(created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_history_deal_status
            ON history_records(deal_status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_history_article_type
            ON history_records(article_type)
        """)

        # 创建回复模板表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reply_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_templates_sort
            ON reply_templates(sort_order)
        """)

        # 检查是否需要插入预设模板
        cursor.execute("SELECT COUNT(*) FROM reply_templates")
        count = cursor.fetchone()[0]

        if count == 0:
            # 插入预设模板
            default_templates = [
                ("开场白-友好", "亲，您好！感谢咨询~请问具体是什么类型的文章呢？方便的话告诉我一下字数要求和截止时间，我给您报个价~", 1),
                ("开场白-专业", "您好！我是专业代写，接过各类稿件。请问您这边需要写什么主题？大概多少字？什么时候要呢？", 2),
                ("询问字数", "好的，请问大概需要多少字呢？", 3),
                ("询问截止日期", "请问什么时候需要呢？急稿的话需要加急费哦~", 4),
                ("询问参考资料", "请问有参考资料或者模板吗？有的话可以发我看看~", 5),
                ("报价话术", "这个难度的话，大概是XX元，包修改到满意为止。您看可以吗？", 6),
                ("催单话术", "亲，考虑得怎么样啦？现在下单的话可以优先安排哦~", 7),
                ("成交确认", "好的，那我们开始吧！请把详细要求发我，写完发您确认~", 8),
            ]

            cursor.executemany(
                "INSERT INTO reply_templates (title, content, sort_order) VALUES (?, ?, ?)",
                default_templates
            )

        # ========== V3 新增表 ==========

        # 会话表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                status TEXT DEFAULT 'active',
                deal_status TEXT DEFAULT 'pending',
                deal_price INTEGER,
                article_type TEXT,
                requirement_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_status
            ON sessions(status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_deal_status
            ON sessions(deal_status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_created_at
            ON sessions(created_at DESC)
        """)

        # 消息表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_messages_session_id
            ON messages(session_id)
        """)

        # AI 分析结果表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                message_id INTEGER NOT NULL,
                suggested_replies TEXT NOT NULL,
                extracted_info TEXT NOT NULL,
                missing_info TEXT NOT NULL,
                can_quote BOOLEAN DEFAULT 0,
                price_min INTEGER,
                price_max INTEGER,
                price_basis TEXT,
                quick_tags TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ai_analyses_session_id
            ON ai_analyses(session_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ai_analyses_message_id
            ON ai_analyses(message_id)
        """)

        # 挽留话术模板表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS retention_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                is_default BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 检查是否需要插入默认挽留话术
        cursor.execute("SELECT COUNT(*) FROM retention_templates")
        retention_count = cursor.fetchone()[0]

        if retention_count == 0:
            cursor.execute("""
                INSERT INTO retention_templates (content, is_default) VALUES (?, ?)
            """, ("虽然因为你的预算不够没成，但特别愿意帮你把把关～你可以给我链接下一个10r订单，我微信转你12r，你要写的东西我也可以帮你看看梳理一下，相当于你多2r+免费咨询。", 1))

        # 要好评话术模板表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS review_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                is_default BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 检查是否需要插入默认要好评话术
        cursor.execute("SELECT COUNT(*) FROM review_templates")
        review_count = cursor.fetchone()[0]

        if review_count == 0:
            cursor.execute("""
                INSERT INTO review_templates (content, is_default) VALUES (?, ?)
            """, ("感谢您的信任和支持！🎉\n\n如果对这次服务满意的话，麻烦给个好评哦～\n您的好评是对我最大的鼓励 ❤️\n\n后续有需要随时找我，老客户优惠哦～✨", 1))
