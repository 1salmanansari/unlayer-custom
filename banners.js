console.log('check update here');
const editorTemplate = `<button id="addBanner" class="button" style="color: ${theme.secondary};background-color:${theme.primary};">Add Banner</button>`;

const logoItemsTemplate = _.template(`
<% _.forEach(banners, function(item) { %>
  <div class="product-item" id="product-item" data-uuid='<%= item.id %>' data-image="<%= item.img %>" >
  <img src="<%= item.img %>" style="max-height: 150px;min-height: 100px;width: 100%;" />
  </div>
<% }); %>
`);

const modalTemplate = function (data) {
    console.log('sam log data', data);
    return `
  <div class="modal" id="product_library_modal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Banner List</h3>
          <button class="close" id="modalCloseBtn">&times;</button>
        </div>
        <div class="modal-body">
        <div>
        <div class="search-box">
        <p id='search-bar'></p>
        <p id='search-btn'></p>
        </div>   
        </div>
          <div class="products-list">
            ${logoItemsTemplate(data)}
          </div>
        </div>
        <div class="modal-footer">
        </div>
      </div>
    </div>
  </div>
`;
};

const toolTemplate = function (values, isViewer = false) {
    return `<div class="product-card" style="position:relative;display:table;min-width:0;word-wrap:break-word;background-color:#fff;background-clip:border-box;border:1px solid rgba(0,0,0,.125);border-radius:4px;margin:auto;text-align:center;">
    <img src="${values?.logo_image?.url ? values?.logo_image?.url : 'https://s3.amazonaws.com/unroll-images-production/projects%2F167%2F1643875820464-188690'
        }" style="width: 100%; object-fit: contain; border-top-left-radius: 4px; border-top-right-radius: 4px;" />
  </div>
  ${isViewer ? modalTemplate({ banners: values.data.banners }) : ''}`;
};

const toolEmailTemplate = function (values, isViewer = false) {
    return `
    <table logoId="${values?.logoLibrary?.selected?.id ? values?.logoLibrary?.selected?.id : ''
        }" cellspacing="0" cellpadding="0" style="position:relative;min-width:0;word-wrap:break-word;background-color:#fff;background-clip:border-box;border:1px solid rgba(0,0,0,.125);border-radius:4px;margin:auto;text-align:center;">
      <tbody>
        <tr><td width="100%"><img id="${values?.logoLibrary?.selected?.id}-logo" src="${values?.logo_image?.url
            ? values?.logo_image?.url
            : 'https://s3.amazonaws.com/unroll-images-production/projects%2F167%2F1643875820464-188690'
        }" style="width: 100%; object-fit: contain; border-top-left-radius: 4px; border-top-right-radius: 4px;" /></td></tr>
      </tbody>
    </table>
  `;
};

const showModal = function () {
    const modal = document.getElementById('product_library_modal');
    modal.classList.add('show');
};

const hideModal = function () {
    const modal = document.getElementById('product_library_modal');
    modal.classList.remove('show');
};

unlayer.registerPropertyEditor({
    name: 'community_banner_library',
    layout: 'bottom',
    Widget: unlayer.createWidget({
        render(value, updateValue, data) {
            return editorTemplate;
        },
        mount(node, value, updateValue, data) {
            const addButton = node.querySelector('#addBanner');
            addButton.onclick = function () {
                showModal();
                setTimeout(() => {
                    // We are using event bubling to capture clicked item instead of registering click event on all product items.
                    const selectButton = document.querySelector('.products-list');
                    console.log('sam target selectButton', selectButton);
                    if (!selectButton) return;
                    selectButton.onclick = function (e) {
                        console.log('sam target', e.target);
                        console.log('sam target id', e.target.id);
                        if (e.target.id === 'product-item') {
                            // If user clicks on logo item
                            // Find selected item from logo list
                            const selectedProduct = data.banners.find(
                                (item) => item.id === parseInt(e.target.dataset.uuid)
                            );
                            console.log('sam target if selectedProduct', selectedProduct);
                            updateValue({ selected: selectedProduct });
                        } else {
                            // If user click on child of product item (e.g. title, price, image or desctiption)
                            const parent = e.target.parentElement;
                            console.log('sam target parent', parent);
                            console.log('sam target parent.id', parent.id);
                            if (parent && parent.id !== 'product-item') return;
                            console.log('sam target parent');
                            const selectedProduct = data.find(
                                (item) => item.id === parseInt(parent.dataset.uuid)
                            );
                            console.log('sam target else selectedProduct', selectedProduct);
                            updateValue({ selected: selectedProduct });
                        }
                        hideModal();
                        // This is a hack to close property editor right bar on selecting an item from banner list.
                        const outerBody = document.querySelector('#u_body');
                        outerBody.click();
                    };
                    const closeBtn = document.querySelector('#modalCloseBtn');
                    closeBtn.onclick = hideModal;
                }, 200);
            };
        },
    }),
});


unlayer.registerTool({
    name: 'community_banner_tool',
    label: 'Banners',
    icon: 'fa-images',
    supportedDisplayModes: ['web', 'email'],
    options: {
        bannerContent: {
            title: 'Community Banner Content',
            position: 1,
            options: {
                bannerLibrary: {
                    label: 'Add a banner from store',
                    defaultValue: '',
                    widget: 'community_banner_library',
                },
            },
        },
    },
    transformer: (values, source) => {
        const { name, value, data } = source;
        // Transform the values here
        // We will update selected values in property editor here
        console.log('sam log details', name, value, data);
        const newValues =
            name === 'bannerLibrary'
                ? {
                    ...values,
                    id: value?.selected?.id,
                    logo_image: {
                        url: value?.selected?.img,
                    },
                }
                : {
                    ...values,
                };

        // Return updated values
        return newValues;
    },
    values: {},
    renderer: {
        Viewer: unlayer.createViewer({
            render(values) {
                console.log('sam log Viewer', values)
                return toolTemplate(values, true);
            },
        }),
        exporters: {
            web(values) {
                console.log('sam log exporters web', values)
                return toolTemplate(values);
            },
            email(values) {
                console.log('sam log exporters email', values)
                return toolEmailTemplate(values);
            },
        },
        head: {
            css(values) { },
            js(values) { },
        },
    },
});
