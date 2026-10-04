import fs from 'fs';

const p = new URL('../app/projects/bodyHtml.tsx', import.meta.url);
let h = fs.readFileSync(p, 'utf8');

const addNeedle = '<div class=\\"pa-form-error-msg\\" id=\\"addTechError\\"><i class=\\"ri-error-warning-line\\"></i> Add at least one technology</div>\\n      </div>\\n    </div>';
const addInsert = `${addNeedle}\\n\\n      <div class=\\"pa-form-group\\">\\n        <label class=\\"pa-form-label\\">Tags</label>\\n        <div class=\\"pa-tech-input-wrap\\">\\n          <input class=\\"pa-tech-input\\" type=\\"text\\" placeholder=\\"Add tags\\" id=\\"addProjTagInput\\" />\\n          <button class=\\"pa-tech-add-btn\\" type=\\"button\\" id=\\"addProjTagAddBtn\\">+ Add</button>\\n        </div>\\n        <div class=\\"pa-tech-chips\\" id=\\"addProjTagChips\\"></div>\\n      </div>\\n    </div>`;

if (!h.includes('addProjTagChips')) {
  h = h.replace(addNeedle, addInsert);
}

const editNeedle = '<div class=\\"pa-form-error-msg\\" id=\\"editTechError\\"><i class=\\"ri-error-warning-line\\"></i> Add at least one technology</div>\\n      </div>\\n    </div>';
const editInsert = `${editNeedle}\\n\\n      <div class=\\"pa-form-group\\">\\n        <label class=\\"pa-form-label\\">Tags</label>\\n        <div class=\\"pa-tech-input-wrap\\">\\n          <input class=\\"pa-tech-input\\" type=\\"text\\" placeholder=\\"Add tags\\" id=\\"editProjTagInput\\" />\\n          <button class=\\"pa-tech-add-btn\\" type=\\"button\\" id=\\"editProjTagAddBtn\\">+ Add</button>\\n        </div>\\n        <div class=\\"pa-tech-chips\\" id=\\"editProjTagChips\\"></div>\\n      </div>\\n    </div>`;

if (!h.includes('editProjTagChips')) {
  h = h.replace(editNeedle, editInsert);
}

fs.writeFileSync(p, h);
console.log('done', h.includes('addProjTagChips'), h.includes('editProjTagChips'));
