import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def list_posts():
    try:
        client = AsyncIOMotorClient('mongodb+srv://manishjini29_db_user:manish@cluster0.dzsfwdw.mongodb.net/?appName=Cluster0')
        db = client.smart_blog_editor
        
        print("="*80)
        print("ALL POSTS IN DATABASE")
        print("="*80)
        
        posts = await db.posts.find().sort("created_at", 1).to_list(100)
        print(f"\nTotal posts: {len(posts)}\n")
        
        for i, post in enumerate(posts, 1):
            print(f"{i}. Title: {post.get('title', 'Untitled')[:40]}")
            print(f"   ID: {post['_id']}")
            print(f"   Status: {post.get('status', 'unknown')}")
            print(f"   Created: {post.get('created_at', 'No timestamp')}")
            print(f"   Updated: {post.get('updated_at', 'No timestamp')}")
            
            # Show first 50 chars of text content
            content = post.get('content', {})
            lexical = content.get('lexical', {})
            if lexical and 'root' in lexical:
                root = lexical['root']
                if root.get('children'):
                    first_child = root['children'][0]
                    if first_child.get('children'):
                        text = first_child['children'][0].get('text', '')
                        print(f"   Content: {text[:50]}...")
                    else:
                        print(f"   Content: (empty)")
                else:
                    print(f"   Content: (no children)")
            else:
                print(f"   Content: (no lexical data)")
            print()
        
        client.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(list_posts())
