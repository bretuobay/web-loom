import { useEffect } from 'react';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { useObservable } from '../hooks/useObservable';
import BackArrow from '../assets/back-arrow.svg';
import { Link } from 'react-router-dom';

const greenHouseSizeOptions = ['25sqm', '50sqm', '100sqm'] as const;

export function GreenhouseList() {
  const greenHouses = useObservable(greenHouseViewModel.data$, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await greenHouseViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('Error fetching greenhouses:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const size = formData.get('size') as string;
    const cropType = formData.get('cropType') as string;
    const data = { name, location, size, cropType };

    const existingGreenhouse = greenHouses?.find((gh) => gh.name === name);
    if (existingGreenhouse) {
      console.error('Greenhouse with this name already exists:', name);
      //  problem with schema means that there is a mis match and execute expects and array of objects
      //  but his is currently a single object
      //  so by pass for now and fix in mvvm-core later
      greenHouseViewModel.updateCommand.execute({
        id: existingGreenhouse.id || '',
        payload: {
          ...existingGreenhouse,
          name,
          location,
          size,
          cropType,
        },
      });

      return;
    }
    console.log('Submitting greenhouse data:', data);
    //  problem with schema means that there is a mis match and execute expects and array of objects
    //  but his is currently a single object
    //  so by pass for now and fix in mvvm-core later

    greenHouseViewModel.createCommand.execute(data);
  };

  const handleDelete = (id?: string) => {
    if (!id) {
      console.error('No ID provided for deletion');
      return;
    }
    greenHouseViewModel.deleteCommand.execute(id);
  };
  const handleUpdate = (id?: string) => {
    const greenhouse = greenHouses?.find((gh) => gh.id === id);
    if (!greenhouse) {
      console.error('Greenhouse not found for update:', id);
      return;
    }
    console.log('Updating greenhouse:', greenhouse);
    (document.getElementById('name') as HTMLInputElement).value = greenhouse.name;
    (document.getElementById('location') as HTMLTextAreaElement).value = greenhouse.location;

    if (!greenHouseSizeOptions.includes(greenhouse.size as (typeof greenHouseSizeOptions)[number])) {
      console.error('Invalid greenhouse size:', greenhouse.size);

      (document.getElementById('size') as HTMLSelectElement).value = '100sqm'; // Default to '100sqm' if invalid
    } else {
      (document.getElementById('size') as HTMLSelectElement).value = greenhouse.size;
    }
    (document.getElementById('cropType') as HTMLInputElement).value = greenhouse.cropType || '';
  };

  return (
    <div className="page-container">
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" />
        Back to Dashboard
      </Link>
      <section className="flex-container flex-row">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Greenhouse Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input-field"
              placeholder="Enter greenhouse name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <textarea
              id="location"
              name="location"
              required
              rows={3}
              className="textarea-field"
              placeholder="Location"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="size">Size:</label>
            <select id="size" className="select-field" name="size" required>
              <option value="">Select size</option>
              <option value="25sqm">25sqm / Small </option>
              <option value="50sqm">50sqm / Medium </option>
              <option value="100sqm">100sqm / Large </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cropType">Crop Type:</label>
            <input type="text" name="cropType" id="cropType" className="input-field" placeholder="Enter crop type" />
          </div>

          <button type="submit" className="button">
            Submit
          </button>
        </form>

        <div className="list-section">
          <h2>Greenhouses</h2>
          {greenHouses && greenHouses.length > 0 ? (
            <ul className="list-container">
              {greenHouses.map((gh) => (
                <li key={gh.id} className="list-item-card">
                  <div className="list-item-header">
                    <h3 className="list-item-title">{gh.name}</h3>
                  </div>
                  <div className="list-item-body">
                    <div className="list-item-field">
                      <span className="list-item-field-label">Location</span>
                      <span className="list-item-field-value">{gh.location}</span>
                    </div>
                    <div className="list-item-field">
                      <span className="list-item-field-label">Size</span>
                      <span className="list-item-field-value">{gh.size}</span>
                    </div>
                    <div className="list-item-field">
                      <span className="list-item-field-label">Crop Type</span>
                      <span className="list-item-field-value">{gh.cropType || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        handleUpdate(gh.id);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => {
                        handleDelete(gh.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="empty-state-title">No greenhouses found</p>
              <p className="empty-state-description">Add a greenhouse using the form to get started</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
