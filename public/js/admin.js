const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const product = btn.parentNode.parentNode;

    fetch('/admin/product/' + prodId , {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    }).then(() => {
        product.remove();
    }).catch(err => console.log(err));
}