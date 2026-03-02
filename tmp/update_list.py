import sys

path = r'c:\Users\guilh\OneDrive\Documentos\GitHub\Portfolio\servicos\index.html'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if 'grid grid-cols-2 gap-x-12 gap-y-4 mb-10' in line:
        start_index = i
    if start_index != -1 and '</div>' in line:
        # We need to find the correct closing div for the grid
        # The grid starts at start_index. 
        # Let's count divs from there.
        div_count = 0
        for j in range(start_index, len(lines)):
            div_count += lines[j].count('<div')
            div_count -= lines[j].count('</div')
            if div_count <= 0:
                end_index = j
                break
        break

if start_index != -1 and end_index != -1:
    new_content = """            <div class="space-y-4 max-w-lg mt-8">
               <div class="atelier-item py-4 border-b border-ink/[0.08] flex justify-between items-center group/item hover:bg-ink/[0.02] transition-all duration-500 px-4 reveal-up">
                 <div class="flex items-center gap-6">
                   <span class="font-mono text-[0.6rem] opacity-30 mt-1">01</span>
                   <span class="font-sans text-[0.9rem] uppercase tracking-widest text-ink font-bold">Arquitetura de Software</span>
                 </div>
                 <span class="font-mono text-[0.55rem] opacity-20 hidden lg:block">System Design</span>
               </div>
               <div class="atelier-item py-4 border-b border-ink/[0.08] flex justify-between items-center group/item hover:bg-ink/[0.02] transition-all duration-500 px-4 reveal-up">
                 <div class="flex items-center gap-6">
                   <span class="font-mono text-[0.6rem] opacity-30 mt-1">02</span>
                   <span class="font-sans text-[0.9rem] uppercase tracking-widest text-ink font-bold">Engenharia SaaS d'Elite</span>
                 </div>
                 <span class="font-mono text-[0.55rem] opacity-20 hidden lg:block">Eco-Systems</span>
               </div>
               <div class="atelier-item py-4 border-b border-ink/[0.08] flex justify-between items-center group/item hover:bg-ink/[0.02] transition-all duration-500 px-4 reveal-up">
                 <div class="flex items-center gap-6">
                   <span class="font-mono text-[0.6rem] opacity-30 mt-1">03</span>
                   <span class="font-sans text-[0.9rem] uppercase tracking-widest text-ink font-bold">Aplicações Mobile Nativas</span>
                 </div>
                 <span class="font-mono text-[0.55rem] opacity-20 hidden lg:block">iOS & Android</span>
               </div>
               <div class="atelier-item py-4 border-b border-ink/[0.08] flex justify-between items-center group/item hover:bg-ink/[0.02] transition-all duration-500 px-4 reveal-up">
                 <div class="flex items-center gap-6">
                   <span class="font-mono text-[0.6rem] opacity-30 mt-1">04</span>
                   <span class="font-sans text-[0.9rem] uppercase tracking-widest text-ink font-bold">Escalabilidade Cloud</span>
                 </div>
                 <span class="font-mono text-[0.55rem] opacity-20 hidden lg:block">Infrastructure</span>
               </div>
               <div class="atelier-item py-4 border-b border-ink/[0.08] flex justify-between items-center group/item hover:bg-ink/[0.02] transition-all duration-500 px-4 reveal-up">
                 <div class="flex items-center gap-6">
                   <span class="font-mono text-[0.6rem] opacity-30 mt-1">05</span>
                   <span class="font-sans text-[0.9rem] uppercase tracking-widest text-ink font-bold">Cibersegurança & Integrações APIs</span>
                 </div>
                 <span class="font-mono text-[0.55rem] opacity-20 hidden lg:block">Security V1</span>
               </div>
            </div>
"""
    lines[start_index:end_index+1] = [new_content]
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully updated the file.")
else:
    print(f"Indices not found: {start_index} to {end_index}")
    sys.exit(1)
