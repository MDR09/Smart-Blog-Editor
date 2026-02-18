import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_posts():
    try:
        client = AsyncIOMotorClient('mongodb+srv://manishjini29_db_user:manish@cluster0.dzsfwdw.mongodb.net/?appName=Cluster0')
        db = client.smart_blog_editor  # Correct database name
        
        print("Connecting to database...")
        posts = await db.posts.find().sort("updated_at", -1).limit(3).to_list(3)
        print(f"Found {len(posts)} posts")
        
        for post in posts:
            print(f"\n{'='*60}")
            print(f"Post ID: {post['_id']}")
            print(f"Title: {post.get('title', 'No title')}")
            print(f"Status: {post.get('status', 'unknown')}")
            print(f"Created at: {post.get('created_at', 'No timestamp')}")
            print(f"Updated at: {post.get('updated_at', 'No timestamp')}")
            
            content = post.get('content', {})
            lexical = content.get('lexical', {})
            
            print(f"\nLexical content keys: {list(lexical.keys())}")
            if lexical:
                print(f"Has root: {'root' in lexical}")
                if 'root' in lexical:
                    root = lexical['root']
                    print(f"Root type: {root.get('type', 'unknown')}")
                    print(f"Root children count: {len(root.get('children', []))}")
                    if root.get('children'):
                        print(f"First child: {root['children'][0] if root['children'] else 'None'}")
            else:
                print("Lexical content is EMPTY!")
            
            print(f"HTML length: {len(content.get('html', ''))}")
        
        client.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_posts())
